"""One-time seed: migrate hardcoded resource links into the database."""
import requests

BASE = "http://localhost:5001/api/projects"

SEEDS = {
    "calendora": [
        {"name": "Calendora App", "url": "https://calendora.replit.app", "type": "link"},
        {"name": "Launch Plan Doc", "url": "https://docs.google.com/document/d/1-7fEvj1eYUEO4WaD734UmC6dbAUO42GxKHyEoAOF7AI", "type": "document"},
        {"name": "Code Repository", "url": "https://github.com", "type": "repo"},
        {"name": "Kindora Family Inc Business Plan and Roadmap", "url": "https://docs.google.com/document/d/1PTmA-sUfD7VPu2q9T0EbyzhNXC28nlVz/edit", "type": "document"},
        {"name": "Kindora Pitch Deck", "url": "https://drive.google.com/file/d/1XeI1knHlRcI1AoWTUGgvIr5Su6cLHixI/view?usp=drive_link", "type": "document"},
    ],
    "langly": [
        {"name": "GitHub Repository", "url": "https://github.com/mvicenzino/langly.git", "type": "repo"},
        {"name": "Kindora Family Inc Business Plan and Roadmap", "url": "https://docs.google.com/document/d/1PTmA-sUfD7VPu2q9T0EbyzhNXC28nlVz/edit", "type": "document"},
    ],
    "stride": [
        {"name": "Stride Content Calendar", "url": "#", "type": "link"},
        {"name": "LinkedIn Profile", "url": "#", "type": "link"},
    ],
}

def seed():
    for project, resources in SEEDS.items():
        # Check existing to avoid duplicates
        existing = requests.get(f"{BASE}/{project}/resources").json()
        existing_names = {r["name"] for r in existing}
        for res in resources:
            if res["name"] in existing_names:
                print(f"  SKIP {project}/{res['name']} (already exists)")
                continue
            r = requests.post(f"{BASE}/{project}/resources", json=res)
            if r.ok:
                print(f"  OK   {project}/{res['name']}")
            else:
                print(f"  FAIL {project}/{res['name']}: {r.status_code} {r.text}")

if __name__ == "__main__":
    seed()
