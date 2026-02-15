"""Agent skill definitions — pre-built prompt templates for quick-access agent capabilities."""
from __future__ import annotations

import io
import re

from flask import Blueprint, jsonify, request
import requests as http_requests

skills_bp = Blueprint("skills", __name__)

SKILLS = [
    {
        "id": "ai-operating-system",
        "name": "30-Day AI Operating System",
        "icon": "cpu",
        "color": "violet",
        "category": "AI Operating",
        "description": "Master 30-day integration roadmap that transforms how you work with AI — from setup through advanced automation",
        "prompt": (
            "I want to build my 30-Day AI Operating System. Act as my AI integration architect. "
            "Create a comprehensive 30-day roadmap divided into 4 phases: "
            "Week 1 — Foundation (tool selection, workspace setup, prompt libraries), "
            "Week 2 — Integration (workflow automation, data pipelines, team onboarding), "
            "Week 3 — Optimization (performance tuning, custom agents, advanced prompting), "
            "Week 4 — Mastery (autonomous workflows, measurement frameworks, scaling playbook). "
            "For each day, provide: specific deliverable, time estimate, tools needed, and success metric. "
            "Include templates, checklists, and example configurations. "
            "Tailor to my role and industry for maximum relevance."
        ),
        "inputLabel": "Describe your role, industry, and current AI usage",
        "inputPlaceholder": "VP of Product at a B2B SaaS company, currently using ChatGPT for drafting...",
        "timeSaved": "4-6 wks → 4-6 hrs",
        "features": [
            "4-phase structured roadmap",
            "Daily deliverables & checklists",
            "Tool selection framework",
            "Measurement & ROI tracking",
        ],
    },
    {
        "id": "executive-insight-agent",
        "name": "Executive Insight Agent",
        "icon": "briefcase",
        "color": "amber",
        "category": "AI Operating",
        "description": "Transforms raw data and observations into polished, board-ready executive memos and strategic briefings",
        "prompt": (
            "Act as my Executive Insight Agent. I'll provide raw data, meeting notes, or observations. "
            "Transform them into a polished executive memo with: "
            "Executive Summary (3-sentence overview), Key Insights (data-backed findings with implications), "
            "Strategic Recommendations (prioritized actions with expected impact), "
            "Risk Assessment (what could go wrong and mitigations), "
            "Decision Framework (options matrix with trade-offs), "
            "and Next Steps (specific actions, owners, timelines). "
            "Use crisp executive language. Include data visualizations descriptions where relevant. "
            "Format as a ready-to-present board document."
        ),
        "inputLabel": "Paste your raw data, notes, or observations",
        "inputPlaceholder": "Q4 revenue was $2.3M, up 15% but churn increased to 8%...",
        "timeSaved": "3-4 hrs → 45 min",
        "features": [
            "Board-ready formatting",
            "Data-backed insights",
            "Decision frameworks",
            "Risk assessment matrices",
        ],
    },
    {
        "id": "decision-architecture",
        "name": "Decision Architecture",
        "icon": "target",
        "color": "red",
        "category": "AI Operating",
        "description": "Builds rigorous financial models with Monte Carlo simulations, scenario analysis, and decision trees",
        "prompt": (
            "Act as my Decision Architect. I'll describe a business decision or investment scenario. "
            "Build a comprehensive decision framework including: "
            "Decision Tree (map all options, probabilities, and outcomes), "
            "Financial Model (revenue projections, cost analysis, NPV/IRR calculations), "
            "Monte Carlo Simulation (describe 1000-run probability distributions for key variables), "
            "Scenario Analysis (best/base/worst cases with probability weights), "
            "Sensitivity Analysis (which variables have the biggest impact), "
            "Risk-Adjusted Returns (expected value calculations), "
            "and Final Recommendation with confidence interval. "
            "Show your work with clear assumptions and methodology."
        ),
        "inputLabel": "Describe the decision or investment scenario",
        "inputPlaceholder": "Should we expand into the European market? Current ARR is $5M...",
        "timeSaved": "2-3 days → 2-3 hrs",
        "features": [
            "Monte Carlo simulations",
            "NPV/IRR calculations",
            "Scenario & sensitivity analysis",
            "Decision tree mapping",
        ],
    },
    {
        "id": "ai-product-architect",
        "name": "AI Product Architect",
        "icon": "rocket",
        "color": "emerald",
        "category": "AI Operating",
        "description": "End-to-end AI product design from initial idea through detailed technical specification and launch plan",
        "prompt": (
            "Act as my AI Product Architect. I'll describe an AI product idea or feature. "
            "Create a comprehensive product specification including: "
            "Vision & Problem Statement (who, what, why), "
            "AI/ML Architecture (model selection, training approach, inference pipeline), "
            "Data Strategy (collection, labeling, storage, privacy), "
            "User Experience Design (interaction patterns, feedback loops, edge cases), "
            "Technical Specification (APIs, infrastructure, scalability requirements), "
            "Evaluation Framework (metrics, A/B testing plan, success criteria), "
            "Build vs Buy Analysis (for each AI component), "
            "MVP Definition (minimum lovable product scope), "
            "Go-to-Market (positioning, pricing, launch sequence), "
            "and Risk Mitigation (bias, hallucination, safety guardrails). "
            "Format as a ready-to-execute product spec."
        ),
        "inputLabel": "Describe your AI product or feature idea",
        "inputPlaceholder": "An AI assistant that helps sales reps prepare for calls by analyzing...",
        "timeSaved": "2-4 wks → 3-4 hrs",
        "features": [
            "AI/ML architecture design",
            "Data strategy & privacy",
            "MVP scoping & launch plan",
            "Evaluation & safety frameworks",
        ],
    },
    {
        "id": "operating-system-architect",
        "name": "Operating System Architect",
        "icon": "cpu",
        "color": "blue",
        "category": "AI Operating",
        "description": "Designs your weekly AI-delegation cadence — what to automate, delegate, and personally execute",
        "prompt": (
            "Act as my Operating System Architect. I'll describe my role, responsibilities, and weekly schedule. "
            "Design a comprehensive weekly AI-delegation operating system including: "
            "Time Audit (categorize current activities by value and AI-delegability), "
            "Delegation Matrix (what to fully automate / AI-assist / personally do), "
            "Weekly Cadence (Mon-Fri structured blocks with AI touchpoints), "
            "AI Agent Assignments (which AI handles what, with specific prompts), "
            "Automation Workflows (triggers, actions, and handoff points), "
            "Decision Protocols (when AI decides vs when you decide), "
            "Communication Templates (AI-drafted comms for common scenarios), "
            "and Measurement Dashboard (hours saved, quality metrics, ROI). "
            "Make it immediately actionable starting next Monday."
        ),
        "inputLabel": "Describe your role and typical weekly responsibilities",
        "inputPlaceholder": "I'm a CTO managing 3 engineering teams, weekly board prep, hiring...",
        "timeSaved": "8-10 hrs/wk saved",
        "features": [
            "Weekly cadence design",
            "AI delegation matrix",
            "Automation workflows",
            "Hours-saved tracking",
        ],
    },
    {
        "id": "business-plan",
        "name": "Business Plan",
        "icon": "briefcase",
        "color": "amber",
        "category": "Strategy & Business",
        "description": "Generates comprehensive strategic business plans with market analysis, financials, and go-to-market strategy",
        "prompt": (
            "Generate a comprehensive business plan. I'll describe the business idea. "
            "Include: Executive Summary, Problem Statement, Solution & Value Proposition, "
            "Target Market & TAM/SAM/SOM, Competitive Analysis (with positioning matrix), "
            "Business Model & Revenue Streams, Go-to-Market Strategy, "
            "Financial Projections (3-year P&L, unit economics, break-even), "
            "Team Requirements, Key Risks & Mitigations, and Funding Requirements. "
            "Use real market data where possible. Format professionally."
        ),
        "inputLabel": "Describe your business idea",
        "inputPlaceholder": "An AI-powered platform that...",
        "timeSaved": "3-5 days → 3-4 hrs",
        "features": [
            "TAM/SAM/SOM analysis",
            "3-year financial projections",
            "Competitive positioning matrix",
            "Go-to-market playbook",
        ],
    },
    {
        "id": "market-intelligence",
        "name": "Market Intelligence",
        "icon": "search",
        "color": "cyan",
        "category": "Strategy & Business",
        "description": "Produces professional market research reports with trends, competitive landscape, and strategic opportunities",
        "prompt": (
            "Conduct deep market research on the topic I provide. "
            "Cover: Market Size & Growth (TAM/SAM/SOM with sources), "
            "Industry Trends & Drivers, Competitive Landscape (top 10 players with analysis), "
            "Customer Segments & Personas, Regulatory Environment, "
            "Technology Trends & Disruption Vectors, Investment & M&A Activity, "
            "SWOT Analysis, Market Entry Barriers, and 5-Year Outlook. "
            "Use real data and cite sources. Include data visualizations descriptions. "
            "Format as a professional market research report ready for stakeholder review."
        ),
        "inputLabel": "What market or industry to research?",
        "inputPlaceholder": "AI agents for enterprise, fintech in LATAM, EV charging infrastructure...",
        "timeSaved": "1-2 wks → 2-3 hrs",
        "features": [
            "Top 10 competitor analysis",
            "Market sizing with sources",
            "Investment & M&A trends",
            "5-year market outlook",
        ],
    },
    {
        "id": "stride-news-articles",
        "name": "Stride News Articles",
        "icon": "user",
        "color": "purple",
        "category": "Content & Communication",
        "description": "Crafts long-form thought leadership articles with compelling narratives, data-backed insights, and SEO optimization",
        "prompt": (
            "Act as my thought leadership ghostwriter. I'll provide a topic and key points. "
            "Create a long-form article (1500-2500 words) with: "
            "Compelling Headline (attention-grabbing, SEO-friendly), "
            "Hook Opening (provocative stat, story, or question), "
            "Thesis Statement (clear point of view), "
            "Structured Argument (3-5 supporting sections with data and examples), "
            "Expert Insights (industry context and forward-looking analysis), "
            "Practical Takeaways (actionable advice for the reader), "
            "Strong Conclusion (call to action or thought-provoking close), "
            "and SEO Elements (meta description, suggested tags, internal link opportunities). "
            "Write in a confident, executive voice. Blend personal insight with industry data."
        ),
        "inputLabel": "What's the article topic and your key points?",
        "inputPlaceholder": "Why AI agents will replace SaaS dashboards — key points: decision fatigue, real-time...",
        "timeSaved": "6-8 hrs → 1-2 hrs",
        "features": [
            "SEO-optimized structure",
            "Data-backed arguments",
            "Executive voice & tone",
            "Ready-to-publish format",
        ],
    },
    {
        "id": "weekly-content-creator",
        "name": "Weekly Content Creator",
        "icon": "chart",
        "color": "teal",
        "category": "Content & Communication",
        "description": "Generates a full week of LinkedIn and X/Twitter posts with hooks, threads, and engagement optimization",
        "prompt": (
            "Act as my social media content strategist. I'll share my expertise areas and recent work. "
            "Create a full week of content (Monday-Friday) for LinkedIn and X/Twitter including: "
            "Monday — Industry Insight (thought leadership post with a hot take), "
            "Tuesday — How-To Thread (5-7 tweet thread breaking down a process), "
            "Wednesday — Personal Story (authentic narrative with business lesson), "
            "Thursday — Data/Research Share (compelling stat with analysis), "
            "Friday — Weekend Reflection (community-building question or retrospective). "
            "For each day provide: LinkedIn version (longer form) and X version (concise + thread). "
            "Include hashtag strategy, optimal posting times, engagement hooks, "
            "and CTA variations. Optimize for algorithm reach and genuine engagement."
        ),
        "inputLabel": "What are your expertise areas and recent wins/insights?",
        "inputPlaceholder": "AI strategy consultant, just helped a client 3x their pipeline using agents...",
        "timeSaved": "4-5 hrs → 45 min",
        "features": [
            "5-day content calendar",
            "LinkedIn + X/Twitter formats",
            "Engagement hook formulas",
            "Hashtag & timing strategy",
        ],
    },
    {
        "id": "website-ux-audit",
        "name": "Website UX Audit",
        "icon": "eye",
        "color": "violet",
        "category": "Design & UX",
        "description": "Comprehensive UX design review with scored rubrics, accessibility checks, and prioritized action plan",
        "prompt": (
            "Perform a thorough UX Design Audit. I'll provide a URL or describe an interface. "
            "Analyze: Information Architecture, Visual Hierarchy, Navigation Patterns, "
            "Accessibility (WCAG 2.1 AA compliance), Mobile Responsiveness, "
            "Interaction Design & Micro-interactions, Cognitive Load Assessment, "
            "Error Handling & Recovery, Onboarding Flow, "
            "Performance Perception (loading states, skeleton screens), "
            "and Conversion Optimization. "
            "Provide a scored rubric (1-10) for each category, key findings with severity ratings, "
            "and a prioritized action plan with estimated impact. "
            "Format as a professional UX audit report."
        ),
        "inputLabel": "Enter URL or describe the interface to audit",
        "inputPlaceholder": "https://example.com or describe the app/page...",
        "timeSaved": "2-3 days → 2-3 hrs",
        "features": [
            "Scored UX rubric (1-10)",
            "WCAG accessibility check",
            "Conversion optimization",
            "Prioritized action plan",
        ],
    },
]


@skills_bp.route("/api/skills")
def get_skills():
    """Get all available agent skills."""
    return jsonify(SKILLS)


@skills_bp.route("/api/skills/<skill_id>")
def get_skill(skill_id):
    """Get a specific skill by ID."""
    skill = next((s for s in SKILLS if s["id"] == skill_id), None)
    if not skill:
        return jsonify({"error": "Skill not found"}), 404
    return jsonify(skill)


@skills_bp.route("/api/skills/extract", methods=["POST"])
def extract_text():
    """Extract text from an uploaded file (TXT, MD, PDF, DOCX) or a Google Docs URL."""

    # ── URL extraction (JSON body) ────────────────────────────
    if request.is_json:
        url = (request.get_json() or {}).get("url", "").strip()
        if not url:
            return jsonify({"error": "Missing url field"}), 400

        try:
            text, name = _extract_from_url(url)
            return jsonify({"text": text, "name": name})
        except Exception as exc:
            return jsonify({"error": str(exc)}), 422

    # ── File upload (multipart) ───────────────────────────────
    if "file" not in request.files:
        return jsonify({"error": "No file or url provided"}), 400

    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "Empty filename"}), 400

    ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else ""

    try:
        if ext in ("txt", "md"):
            text = f.read().decode("utf-8", errors="replace")
        elif ext == "pdf":
            text = _extract_pdf(f)
        elif ext == "docx":
            text = _extract_docx(f)
        else:
            return jsonify({"error": f"Unsupported file type: .{ext}"}), 400
    except Exception as exc:
        return jsonify({"error": f"Extraction failed: {exc}"}), 422

    return jsonify({"text": text, "name": f.filename})


# ── helpers ───────────────────────────────────────────────────

def _extract_pdf(f) -> str:
    from PyPDF2 import PdfReader

    reader = PdfReader(io.BytesIO(f.read()))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n\n".join(pages).strip()


def _extract_docx(f) -> str:
    import docx

    doc = docx.Document(io.BytesIO(f.read()))
    return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())


def _extract_from_url(url: str) -> tuple:
    """Fetch text from a Google Docs link or a plain URL."""
    # Google Docs → export as plain text
    m = re.match(r"https?://docs\.google\.com/document/d/([^/]+)", url)
    if m:
        doc_id = m.group(1)
        export_url = f"https://docs.google.com/document/d/{doc_id}/export?format=txt"
        resp = http_requests.get(export_url, timeout=15)
        resp.raise_for_status()
        return resp.text.strip(), f"google-doc-{doc_id[:8]}.txt"

    # Generic URL → fetch and strip HTML
    resp = http_requests.get(url, timeout=15)
    resp.raise_for_status()
    content_type = resp.headers.get("content-type", "")
    if "html" in content_type:
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
    else:
        text = resp.text
    name = url.rstrip("/").rsplit("/", 1)[-1][:40] or "webpage"
    return text.strip(), name
