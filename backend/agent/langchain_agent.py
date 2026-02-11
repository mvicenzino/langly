import os
import json
import csv
import subprocess
import smtplib
import re
import sqlite3
from io import StringIO
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_react_agent
from langchain.tools import Tool
from langchain_core.prompts import PromptTemplate
from serpapi import GoogleSearch
import requests
from bs4 import BeautifulSoup
import wikipedia
import yfinance as yf

# Load API keys from .env
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))


# --- Helper Functions ---

def _clean_path(s: str) -> str:
    """Strip backticks, quotes, and whitespace from file paths."""
    return s.strip().strip("`").strip("'").strip('"').strip()


def _clean_input(s: str) -> str:
    """Strip backticks and matching outer quotes from inputs."""
    s = s.strip().strip("`").strip()
    if len(s) >= 2 and s[0] == s[-1] and s[0] in ("'", '"'):
        s = s[1:-1]
    return s


# =====================
# ORIGINAL 10 TOOLS
# =====================

def search(query: str) -> str:
    """Search the web using SerpAPI."""
    try:
        params = {
            "q": query,
            "api_key": os.environ.get("SERPAPI_API_KEY"),
            "num": 5,
        }
        results = GoogleSearch(params).get_dict()
        if "answer_box" in results:
            box = results["answer_box"]
            if "answer" in box:
                return box["answer"]
            if "snippet" in box:
                return box["snippet"]
        if "organic_results" in results:
            snippets = []
            for r in results["organic_results"][:3]:
                title = r.get("title", "")
                snippet = r.get("snippet", "")
                link = r.get("link", "")
                snippets.append(f"{title}\n{snippet}\n{link}")
            return "\n\n".join(snippets)
        return "No results found."
    except Exception as e:
        return f"Search error: {e}"


def calculator(expression: str) -> str:
    """Evaluate a math expression."""
    try:
        expr = _clean_path(expression)
        allowed = {"__builtins__": {}}
        import math
        allowed.update({k: getattr(math, k) for k in dir(math) if not k.startswith("_")})
        result = eval(expr, allowed)
        return str(result)
    except Exception as e:
        return f"Error: {e}"


def get_current_date(input: str = "") -> str:
    """Get the current date and time."""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def wiki_lookup(query: str) -> str:
    """Look up a topic on Wikipedia."""
    try:
        page = wikipedia.page(query, auto_suggest=True)
        return page.summary[:1500]
    except wikipedia.DisambiguationError as e:
        return f"Disambiguation: did you mean one of these? {', '.join(e.options[:5])}"
    except wikipedia.PageError:
        return f"No Wikipedia page found for '{query}'."
    except Exception as e:
        return f"Wikipedia error: {e}"


def fetch_webpage(url: str) -> str:
    """Fetch and extract text content from a webpage."""
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        resp = requests.get(_clean_input(url), headers=headers, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        return text[:3000]
    except Exception as e:
        return f"Error fetching URL: {e}"


def weather(location: str) -> str:
    """Get current weather for a location using wttr.in."""
    try:
        loc = _clean_input(location)
        resp = requests.get(f"https://wttr.in/{loc}?format=j1", timeout=20)
        resp.raise_for_status()
        data = resp.json()
        current = data["current_condition"][0]
        desc = current["weatherDesc"][0]["value"]
        temp_f = current["temp_F"]
        temp_c = current["temp_C"]
        humidity = current["humidity"]
        wind_mph = current["windspeedMiles"]
        feels_f = current["FeelsLikeF"]
        area = data["nearest_area"][0]["areaName"][0]["value"]
        return f"{area}: {desc}, {temp_f}°F ({temp_c}°C), Feels like {feels_f}°F, Humidity {humidity}%, Wind {wind_mph} mph"
    except Exception as e:
        return f"Weather error: {e}"


def run_python(code: str) -> str:
    """Execute Python code and return the output."""
    try:
        cleaned = _clean_input(code)
        result = subprocess.run(
            ["python3", "-c", cleaned],
            capture_output=True, text=True, timeout=15
        )
        output = result.stdout.strip()
        if result.returncode != 0:
            output += f"\nError: {result.stderr.strip()}"
        return output if output else "Code executed with no output."
    except subprocess.TimeoutExpired:
        return "Error: Code execution timed out (15s limit)."
    except Exception as e:
        return f"Error: {e}"


def read_file(filepath: str) -> str:
    """Read the contents of a local file."""
    try:
        path = os.path.expanduser(_clean_path(filepath))
        with open(path, "r") as f:
            content = f.read()
        if len(content) > 3000:
            return content[:3000] + "\n... (truncated)"
        return content
    except Exception as e:
        return f"Error reading file: {e}"


def write_file(input_str: str) -> str:
    """Write content to a file. Input format: filepath|||content"""
    try:
        parts = input_str.split("|||", 1)
        if len(parts) != 2:
            return "Error: Input must be in format 'filepath|||content'"
        filepath = os.path.expanduser(_clean_path(parts[0]))
        content = parts[1]
        with open(filepath, "w") as f:
            f.write(content)
        return f"Successfully wrote to {filepath}"
    except Exception as e:
        return f"Error writing file: {e}"


def shell_command(command: str) -> str:
    """Run a shell command and return its output."""
    try:
        cmd = _clean_input(command)
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=15
        )
        output = result.stdout.strip()
        if result.returncode != 0:
            output += f"\nError: {result.stderr.strip()}"
        return output if output else "Command executed with no output."
    except subprocess.TimeoutExpired:
        return "Error: Command timed out (15s limit)."
    except Exception as e:
        return f"Error: {e}"


# =====================
# AI / LLM TOOLS
# =====================

def summarize_text(text: str) -> str:
    """Summarize a block of text using GPT."""
    try:
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        resp = llm.invoke(f"Summarize the following text concisely:\n\n{_clean_input(text)}")
        return resp.content
    except Exception as e:
        return f"Summarize error: {e}"


def translate_text(input_str: str) -> str:
    """Translate text to a target language. Input format: target_language|||text"""
    try:
        parts = input_str.split("|||", 1)
        if len(parts) != 2:
            return "Error: Input must be in format 'target_language|||text to translate'"
        lang = _clean_input(parts[0])
        text = parts[1].strip()
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        resp = llm.invoke(f"Translate the following text to {lang}. Only return the translation, nothing else:\n\n{text}")
        return resp.content
    except Exception as e:
        return f"Translate error: {e}"


def sentiment_analysis(text: str) -> str:
    """Analyze the sentiment of text using GPT."""
    try:
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        resp = llm.invoke(
            f"Analyze the sentiment of the following text. "
            f"Respond with: Sentiment (Positive/Negative/Neutral), Confidence (High/Medium/Low), "
            f"and a brief explanation.\n\n{_clean_input(text)}"
        )
        return resp.content
    except Exception as e:
        return f"Sentiment error: {e}"


def text_rewriter(input_str: str) -> str:
    """Rewrite text in a given style. Input format: style|||text (styles: formal, casual, concise, persuasive, technical)"""
    try:
        parts = input_str.split("|||", 1)
        if len(parts) != 2:
            return "Error: Input must be in format 'style|||text'"
        style = _clean_input(parts[0])
        text = parts[1].strip()
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
        resp = llm.invoke(f"Rewrite the following text in a {style} style. Only return the rewritten text:\n\n{text}")
        return resp.content
    except Exception as e:
        return f"Rewrite error: {e}"


# =====================
# DATA TOOLS
# =====================

def stock_price(ticker: str) -> str:
    """Get current stock price and info for a ticker symbol."""
    try:
        t = _clean_input(ticker).upper()
        stock = yf.Ticker(t)
        info = stock.info
        price = info.get("currentPrice") or info.get("regularMarketPrice", "N/A")
        prev_close = info.get("previousClose", "N/A")
        market_cap = info.get("marketCap", "N/A")
        name = info.get("shortName", t)
        day_high = info.get("dayHigh", "N/A")
        day_low = info.get("dayLow", "N/A")
        volume = info.get("volume", "N/A")
        if market_cap and market_cap != "N/A":
            if market_cap >= 1e12:
                market_cap = f"${market_cap/1e12:.2f}T"
            elif market_cap >= 1e9:
                market_cap = f"${market_cap/1e9:.2f}B"
            else:
                market_cap = f"${market_cap/1e6:.2f}M"
        change = ""
        if price != "N/A" and prev_close != "N/A":
            pct = ((price - prev_close) / prev_close) * 100
            change = f" ({'+' if pct >= 0 else ''}{pct:.2f}%)"
        return f"{name} ({t}): ${price}{change} | Day: ${day_low}-${day_high} | Vol: {volume:,} | Cap: {market_cap}"
    except Exception as e:
        return f"Stock error: {e}"


def currency_convert(input_str: str) -> str:
    """Convert currency. Input format: amount FROM TO (e.g., 100 USD EUR)"""
    try:
        parts = _clean_input(input_str).upper().split()
        if len(parts) != 3:
            return "Error: Input format should be 'amount FROM TO' (e.g., '100 USD EUR')"
        amount = float(parts[0])
        from_cur = parts[1]
        to_cur = parts[2]
        resp = requests.get(
            f"https://api.exchangerate-api.com/v4/latest/{from_cur}",
            timeout=10
        )
        resp.raise_for_status()
        rates = resp.json()["rates"]
        if to_cur not in rates:
            return f"Error: Unknown currency '{to_cur}'"
        converted = amount * rates[to_cur]
        return f"{amount:.2f} {from_cur} = {converted:.2f} {to_cur} (rate: {rates[to_cur]:.4f})"
    except ValueError:
        return "Error: First value must be a number (e.g., '100 USD EUR')"
    except Exception as e:
        return f"Currency error: {e}"


def parse_csv(input_str: str) -> str:
    """Parse CSV data or file and return summary. Input: file path OR raw CSV text."""
    try:
        cleaned = _clean_input(input_str)
        if os.path.exists(os.path.expanduser(cleaned)):
            path = os.path.expanduser(cleaned)
            with open(path, "r") as f:
                reader = csv.DictReader(f)
                rows = list(reader)
        else:
            reader = csv.DictReader(StringIO(cleaned))
            rows = list(reader)
        if not rows:
            return "Empty CSV data."
        headers = list(rows[0].keys())
        result = f"Rows: {len(rows)} | Columns: {len(headers)}\n"
        result += f"Headers: {', '.join(headers)}\n"
        result += f"First 3 rows:\n"
        for row in rows[:3]:
            result += f"  {dict(row)}\n"
        return result
    except Exception as e:
        return f"CSV error: {e}"


def parse_json(input_str: str) -> str:
    """Parse JSON data or file and return summary. Input: file path OR raw JSON text."""
    try:
        cleaned = _clean_input(input_str)
        if os.path.exists(os.path.expanduser(cleaned)):
            with open(os.path.expanduser(cleaned), "r") as f:
                data = json.load(f)
        else:
            data = json.loads(cleaned)
        if isinstance(data, list):
            result = f"JSON Array with {len(data)} items.\n"
            if data:
                result += f"First item type: {type(data[0]).__name__}\n"
                result += f"First item: {json.dumps(data[0], indent=2)[:500]}"
        elif isinstance(data, dict):
            result = f"JSON Object with {len(data)} keys.\n"
            result += f"Keys: {', '.join(list(data.keys())[:20])}\n"
            result += f"Preview: {json.dumps(data, indent=2)[:500]}"
        else:
            result = f"JSON value: {data}"
        return result
    except Exception as e:
        return f"JSON error: {e}"


def api_request(input_str: str) -> str:
    """Make an HTTP API request. Input format: METHOD URL [|||json_body]"""
    try:
        cleaned = _clean_input(input_str)
        body = None
        if "|||" in cleaned:
            cleaned, body = cleaned.split("|||", 1)
            body = json.loads(body.strip())
        parts = cleaned.strip().split(None, 1)
        if len(parts) != 2:
            return "Error: Input format 'METHOD URL' (e.g., 'GET https://api.example.com/data')"
        method = parts[0].upper()
        url = parts[1].strip()
        headers = {"User-Agent": "LangChainAgent/1.0", "Accept": "application/json"}
        resp = requests.request(method, url, json=body, headers=headers, timeout=15)
        resp.raise_for_status()
        try:
            data = resp.json()
            return json.dumps(data, indent=2)[:3000]
        except ValueError:
            return resp.text[:3000]
    except Exception as e:
        return f"API error: {e}"


# =====================
# PRODUCTIVITY TOOLS
# =====================

def todo_manager(input_str: str) -> str:
    """Manage a todo list. Input: add TASK | list | done NUMBER | remove NUMBER"""
    try:
        todo_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "todos.json")
        if os.path.exists(todo_file):
            with open(todo_file, "r") as f:
                todos = json.load(f)
        else:
            todos = []

        cmd = _clean_input(input_str).strip()

        if cmd.lower() == "list":
            if not todos:
                return "Todo list is empty."
            lines = []
            for i, t in enumerate(todos, 1):
                status = "[x]" if t["done"] else "[ ]"
                lines.append(f"{i}. {status} {t['task']}")
            return "\n".join(lines)

        elif cmd.lower().startswith("add "):
            task = cmd[4:].strip()
            todos.append({"task": task, "done": False, "created": datetime.now().isoformat()})
            with open(todo_file, "w") as f:
                json.dump(todos, f, indent=2)
            return f"Added: {task} (#{len(todos)})"

        elif cmd.lower().startswith("done "):
            num = int(cmd[5:].strip()) - 1
            if 0 <= num < len(todos):
                todos[num]["done"] = True
                with open(todo_file, "w") as f:
                    json.dump(todos, f, indent=2)
                return f"Completed: {todos[num]['task']}"
            return "Error: Invalid task number."

        elif cmd.lower().startswith("remove "):
            num = int(cmd[7:].strip()) - 1
            if 0 <= num < len(todos):
                removed = todos.pop(num)
                with open(todo_file, "w") as f:
                    json.dump(todos, f, indent=2)
                return f"Removed: {removed['task']}"
            return "Error: Invalid task number."

        return "Error: Use 'add TASK', 'list', 'done NUMBER', or 'remove NUMBER'"
    except Exception as e:
        return f"Todo error: {e}"


def timer_tool(input_str: str) -> str:
    """Set a countdown timer. Input: number of seconds to wait."""
    try:
        import time
        seconds = int(_clean_input(input_str))
        if seconds > 300:
            return "Error: Max timer is 300 seconds (5 minutes)."
        time.sleep(seconds)
        return f"Timer complete! {seconds} seconds elapsed."
    except ValueError:
        return "Error: Input must be a number of seconds."
    except Exception as e:
        return f"Timer error: {e}"


def send_email(input_str: str) -> str:
    """Send an email. Input format: to@email.com|||subject|||body"""
    try:
        parts = input_str.split("|||")
        if len(parts) != 3:
            return "Error: Input must be 'to@email.com|||subject|||body'"
        to_email = _clean_input(parts[0])
        subject = parts[1].strip()
        body = parts[2].strip()

        smtp_host = os.environ.get("SMTP_HOST", "")
        smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        smtp_user = os.environ.get("SMTP_USER", "")
        smtp_pass = os.environ.get("SMTP_PASS", "")

        if not all([smtp_host, smtp_user, smtp_pass]):
            return "Error: Email not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env"

        msg = MIMEMultipart()
        msg["From"] = smtp_user
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        return f"Email sent to {to_email}."
    except Exception as e:
        return f"Email error: {e}"


def note_manager(input_str: str) -> str:
    """Manage notes. Input: save TITLE|||content | list | read TITLE | delete TITLE"""
    try:
        notes_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "notes")
        os.makedirs(notes_dir, exist_ok=True)
        cmd = _clean_input(input_str).strip()

        if cmd.lower() == "list":
            files = [f[:-4] for f in os.listdir(notes_dir) if f.endswith(".txt")]
            if not files:
                return "No notes saved."
            return "Notes: " + ", ".join(sorted(files))

        elif cmd.lower().startswith("save "):
            rest = cmd[5:]
            if "|||" not in rest:
                return "Error: Use 'save TITLE|||content'"
            title, content = rest.split("|||", 1)
            title = re.sub(r'[^\w\s-]', '', title.strip()).replace(" ", "_")
            with open(os.path.join(notes_dir, f"{title}.txt"), "w") as f:
                f.write(content.strip())
            return f"Note '{title}' saved."

        elif cmd.lower().startswith("read "):
            title = re.sub(r'[^\w\s-]', '', cmd[5:].strip()).replace(" ", "_")
            path = os.path.join(notes_dir, f"{title}.txt")
            if os.path.exists(path):
                with open(path, "r") as f:
                    return f.read()
            return f"Note '{title}' not found."

        elif cmd.lower().startswith("delete "):
            title = re.sub(r'[^\w\s-]', '', cmd[7:].strip()).replace(" ", "_")
            path = os.path.join(notes_dir, f"{title}.txt")
            if os.path.exists(path):
                os.remove(path)
                return f"Note '{title}' deleted."
            return f"Note '{title}' not found."

        return "Error: Use 'save TITLE|||content', 'list', 'read TITLE', or 'delete TITLE'"
    except Exception as e:
        return f"Note error: {e}"


# =====================
# DEVELOPER TOOLS
# =====================

def git_tool(input_str: str) -> str:
    """Run git commands. Input: any git command (e.g., 'status', 'log --oneline -5', 'diff')"""
    try:
        cmd = _clean_input(input_str)
        if not cmd.startswith("git "):
            cmd = f"git {cmd}"
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=15
        )
        output = result.stdout.strip()
        if result.returncode != 0:
            output += f"\nError: {result.stderr.strip()}"
        return output[:3000] if output else "Git command executed with no output."
    except subprocess.TimeoutExpired:
        return "Error: Git command timed out."
    except Exception as e:
        return f"Git error: {e}"


def regex_tool(input_str: str) -> str:
    """Test a regex pattern against text. Input format: pattern|||text"""
    try:
        parts = input_str.split("|||", 1)
        if len(parts) != 2:
            return "Error: Input must be 'pattern|||text'"
        pattern = parts[0].strip()
        text = parts[1].strip()
        matches = re.findall(pattern, text)
        if not matches:
            return "No matches found."
        return f"Found {len(matches)} match(es): {matches[:20]}"
    except re.error as e:
        return f"Regex error: {e}"
    except Exception as e:
        return f"Error: {e}"


def sqlite_tool(input_str: str) -> str:
    """Execute SQLite queries. Input format: db_path|||SQL query"""
    try:
        parts = input_str.split("|||", 1)
        if len(parts) != 2:
            return "Error: Input must be 'db_path|||SQL query'"
        db_path = os.path.expanduser(_clean_path(parts[0]))
        query = parts[1].strip()
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(query)
        if query.strip().upper().startswith("SELECT"):
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            rows = cursor.fetchmany(50)
            conn.close()
            if not rows:
                return "Query returned no results."
            result = f"Columns: {', '.join(columns)}\n"
            for row in rows:
                result += f"  {row}\n"
            return result[:3000]
        else:
            conn.commit()
            affected = cursor.rowcount
            conn.close()
            return f"Query executed. Rows affected: {affected}"
    except Exception as e:
        return f"SQLite error: {e}"


def docker_tool(input_str: str) -> str:
    """Run Docker commands. Input: any docker command (e.g., 'ps', 'images', 'logs container_name')"""
    try:
        cmd = _clean_input(input_str)
        if not cmd.startswith("docker "):
            cmd = f"docker {cmd}"
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=30
        )
        output = result.stdout.strip()
        if result.returncode != 0:
            output += f"\nError: {result.stderr.strip()}"
        return output[:3000] if output else "Docker command executed with no output."
    except subprocess.TimeoutExpired:
        return "Error: Docker command timed out."
    except Exception as e:
        return f"Docker error: {e}"


def json_formatter(input_str: str) -> str:
    """Format/validate JSON. Input: raw JSON string or file path."""
    try:
        cleaned = _clean_input(input_str)
        if os.path.exists(os.path.expanduser(cleaned)):
            with open(os.path.expanduser(cleaned), "r") as f:
                data = json.load(f)
        else:
            data = json.loads(cleaned)
        return json.dumps(data, indent=2)[:3000]
    except json.JSONDecodeError as e:
        return f"Invalid JSON: {e}"
    except Exception as e:
        return f"Error: {e}"


# =====================
# TOOL REGISTRY
# =====================

tools = [
    # --- Original 10 ---
    Tool(name="Search", func=search,
         description="Search the web for current information. Input: a search query."),
    Tool(name="Calculator", func=calculator,
         description="Evaluate math expressions. Supports sqrt(), sin(), pi, etc. Input: a math expression."),
    Tool(name="GetDateTime", func=get_current_date,
         description="Get the current date and time. Input can be any string or empty."),
    Tool(name="Wikipedia", func=wiki_lookup,
         description="Look up a topic on Wikipedia. Input: a topic name."),
    Tool(name="WebScraper", func=fetch_webpage,
         description="Fetch and read text from a webpage. Input: a full URL."),
    Tool(name="Weather", func=weather,
         description="Get current weather for a location. Input: city name or location."),
    Tool(name="PythonREPL", func=run_python,
         description="Execute Python code and return output. Input: Python code as a string."),
    Tool(name="ReadFile", func=read_file,
         description="Read the contents of a local file. Input: file path."),
    Tool(name="WriteFile", func=write_file,
         description="Write content to a local file. Input format: filepath|||content"),
    Tool(name="Shell", func=shell_command,
         description="Run a shell command. Input: a shell command string."),
    # --- AI / LLM ---
    Tool(name="Summarize", func=summarize_text,
         description="Summarize a block of text using AI. Input: the text to summarize."),
    Tool(name="Translate", func=translate_text,
         description="Translate text to another language. Input format: target_language|||text"),
    Tool(name="Sentiment", func=sentiment_analysis,
         description="Analyze sentiment of text (Positive/Negative/Neutral). Input: the text to analyze."),
    Tool(name="Rewrite", func=text_rewriter,
         description="Rewrite text in a style (formal, casual, concise, persuasive, technical). Input: style|||text"),
    # --- Data ---
    Tool(name="StockPrice", func=stock_price,
         description="Get current stock price and info. Input: ticker symbol (e.g., AAPL, TSLA, GOOGL)."),
    Tool(name="CurrencyConvert", func=currency_convert,
         description="Convert between currencies. Input: amount FROM TO (e.g., 100 USD EUR)."),
    Tool(name="ParseCSV", func=parse_csv,
         description="Parse CSV data or file. Input: file path or raw CSV text."),
    Tool(name="ParseJSON", func=parse_json,
         description="Parse and summarize JSON data or file. Input: file path or raw JSON text."),
    Tool(name="APIRequest", func=api_request,
         description="Make HTTP API requests. Input: METHOD URL [|||json_body] (e.g., GET https://api.example.com/data)."),
    # --- Productivity ---
    Tool(name="Todo", func=todo_manager,
         description="Manage a todo list. Input: add TASK | list | done NUMBER | remove NUMBER"),
    Tool(name="Timer", func=timer_tool,
         description="Set a countdown timer. Input: number of seconds (max 300)."),
    Tool(name="SendEmail", func=send_email,
         description="Send an email. Input: to@email.com|||subject|||body. Requires SMTP config in .env."),
    Tool(name="Notes", func=note_manager,
         description="Manage notes. Input: save TITLE|||content | list | read TITLE | delete TITLE"),
    # --- Developer ---
    Tool(name="Git", func=git_tool,
         description="Run git commands. Input: git command (e.g., status, log --oneline -5, diff)."),
    Tool(name="Regex", func=regex_tool,
         description="Test a regex pattern. Input: pattern|||text"),
    Tool(name="SQLite", func=sqlite_tool,
         description="Execute SQLite queries. Input: db_path|||SQL query"),
    Tool(name="Docker", func=docker_tool,
         description="Run Docker commands. Input: docker command (e.g., ps, images, logs)."),
    Tool(name="FormatJSON", func=json_formatter,
         description="Format and validate JSON. Input: raw JSON string or file path."),
]

# Set up the LLM
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# ReAct prompt template
prompt = PromptTemplate.from_template(
    """Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought:{agent_scratchpad}"""
)

# Create the agent
agent = create_react_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True, handle_parsing_errors=True, max_iterations=25)

# Interactive loop
if __name__ == "__main__":
    print("LangChain Agent Ready!")
    print(f"Tools ({len(tools)}): {', '.join(t.name for t in tools)}")
    print("Type 'quit' to exit.\n")
    while True:
        user_input = input("You: ")
        if user_input.lower() in ("quit", "exit", "q"):
            print("Goodbye!")
            break
        response = executor.invoke({"input": user_input})
        print(f"\nAgent: {response['output']}\n")
