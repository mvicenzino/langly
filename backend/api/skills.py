"""Agent skill definitions — pre-built prompt templates for quick-access agent capabilities."""
from flask import Blueprint, jsonify

skills_bp = Blueprint("skills", __name__)

SKILLS = [
    {
        "id": "ux-audit",
        "name": "UX Design Audit",
        "icon": "eye",
        "color": "violet",
        "category": "design",
        "description": "Comprehensive UX/UI analysis with actionable recommendations",
        "prompt": (
            "Perform a thorough UX Design Audit. I'll provide a URL or describe an interface. "
            "Analyze: information architecture, visual hierarchy, navigation patterns, "
            "accessibility (WCAG), mobile responsiveness, interaction design, cognitive load, "
            "error handling, and onboarding flow. "
            "Provide a scored rubric (1-10) for each category, key findings with screenshots "
            "descriptions, and a prioritized action plan. Format as a professional audit report."
        ),
        "inputLabel": "Enter URL or describe the interface to audit",
        "inputPlaceholder": "https://example.com or describe the app/page...",
    },
    {
        "id": "business-plan",
        "name": "Business Plan Generator",
        "icon": "briefcase",
        "color": "amber",
        "category": "strategy",
        "description": "Full business plan with market analysis, financials, and go-to-market",
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
    },
    {
        "id": "market-research",
        "name": "Deep Market Research",
        "icon": "search",
        "color": "cyan",
        "category": "research",
        "description": "In-depth market analysis with trends, competitors, and opportunities",
        "prompt": (
            "Conduct deep market research on the topic I provide. "
            "Cover: Market Size & Growth (TAM/SAM/SOM with sources), "
            "Industry Trends & Drivers, Competitive Landscape (top 10 players with analysis), "
            "Customer Segments & Personas, Regulatory Environment, "
            "Technology Trends & Disruption Vectors, Investment & M&A Activity, "
            "SWOT Analysis, Market Entry Barriers, and 5-Year Outlook. "
            "Use real data and cite sources. Include data visualizations descriptions."
        ),
        "inputLabel": "What market or industry to research?",
        "inputPlaceholder": "AI agents for enterprise, fintech in LATAM...",
    },
    {
        "id": "competitive-intel",
        "name": "Competitive Intelligence",
        "icon": "target",
        "color": "red",
        "category": "strategy",
        "description": "Deep competitive analysis with positioning and strategic recommendations",
        "prompt": (
            "Build a competitive intelligence report. I'll name the company or product space. "
            "Analyze: Direct & indirect competitors, feature comparison matrix, "
            "pricing analysis, market positioning map, technology stack comparison, "
            "go-to-market strategies, funding history, team & leadership, "
            "customer reviews & sentiment, strengths/weaknesses, and strategic recommendations. "
            "Present as an actionable intelligence brief."
        ),
        "inputLabel": "Company or product space to analyze",
        "inputPlaceholder": "Notion vs Confluence, or a specific company...",
    },
    {
        "id": "product-strategy",
        "name": "Product Strategy Brief",
        "icon": "rocket",
        "color": "emerald",
        "category": "product",
        "description": "Product strategy document with roadmap and success metrics",
        "prompt": (
            "Create a product strategy brief. I'll describe the product or feature. "
            "Include: Vision & Mission, User Problems (Jobs-to-be-Done framework), "
            "Success Metrics (North Star + supporting KPIs), Feature Prioritization "
            "(RICE or ICE scoring), User Journey Map, Technical Feasibility Assessment, "
            "MVP Definition, 90-Day Roadmap, Resource Requirements, "
            "Risk Assessment, and Competitive Differentiation. "
            "Format as a ready-to-present strategy document."
        ),
        "inputLabel": "Describe the product or feature",
        "inputPlaceholder": "A dashboard for tracking customer health scores...",
    },
    {
        "id": "tech-architecture",
        "name": "Architecture Review",
        "icon": "cpu",
        "color": "blue",
        "category": "engineering",
        "description": "Technical architecture design or review with diagrams and trade-offs",
        "prompt": (
            "Perform a technical architecture review or design. I'll describe the system. "
            "Cover: System Overview & Context Diagram, Component Architecture, "
            "Data Flow & Storage Design, API Design (REST/GraphQL/gRPC), "
            "Scalability Analysis (horizontal/vertical, bottlenecks), "
            "Security Architecture (auth, encryption, OWASP), "
            "Infrastructure & Deployment (cloud, containers, CI/CD), "
            "Monitoring & Observability, Cost Estimation, "
            "Trade-offs & Alternatives, and Migration Path (if applicable). "
            "Include ASCII architecture diagrams."
        ),
        "inputLabel": "Describe the system or architecture",
        "inputPlaceholder": "Real-time analytics pipeline processing 1M events/sec...",
    },
    {
        "id": "resume-optimizer",
        "name": "Resume Optimizer",
        "icon": "user",
        "color": "purple",
        "category": "career",
        "description": "ATS-optimized resume tailoring for specific job descriptions",
        "prompt": (
            "Optimize my resume for a specific job. I'll provide the job description "
            "and optionally my current resume. "
            "Analyze: Keyword matching & ATS optimization score, "
            "skills gap analysis, achievement quantification improvements, "
            "bullet point rewrites with STAR method, "
            "professional summary optimization, "
            "section ordering recommendations, "
            "formatting & readability improvements, "
            "and a final optimized version. "
            "Score before and after (0-100)."
        ),
        "inputLabel": "Paste the job description (and optionally your resume)",
        "inputPlaceholder": "Job Title: VP of Product at...",
    },
    {
        "id": "data-analysis",
        "name": "Data Analysis",
        "icon": "chart",
        "color": "teal",
        "category": "analytics",
        "description": "Statistical analysis and insights from data descriptions",
        "prompt": (
            "Perform a data analysis. I'll describe the dataset or paste data. "
            "Provide: Data Overview & Quality Assessment, "
            "Descriptive Statistics, Distribution Analysis, "
            "Correlation & Pattern Discovery, Trend Analysis, "
            "Anomaly Detection, Hypothesis Testing (if applicable), "
            "Segmentation & Clustering insights, "
            "Predictive Indicators, Visualization Recommendations, "
            "and Executive Summary with actionable insights. "
            "Use statistical rigor and explain methodology."
        ),
        "inputLabel": "Describe or paste your data",
        "inputPlaceholder": "Monthly revenue data for the past 2 years...",
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
