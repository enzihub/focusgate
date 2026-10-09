# tests/test_newsletter_template.py

from datetime import datetime
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

LOGO_URL = "https://example.com/logo.png"


def get_template_path():
    """Get the absolute path to the templates directory"""
    current_dir = Path(__file__).parent
    template_dir = current_dir.parent / "templates"
    return template_dir


def test_newsletter_template_renders():
    # Setup template environment
    env = Environment(loader=FileSystemLoader(get_template_path()))
    template = env.get_template("newsletter.html")

    # Prepare test data
    test_data = {
        "title": "Daily Executive Summary",
        "timestamp": datetime.now().strftime("%B %d, %Y"),
        "logo_data": LOGO_URL,
        "day_of_week": "Monday",
        "date": "January 10, 2025",
        "summary": """
            <div class="text">
            <span class="bold">Executive Summary:</span>
            <div class="text-content">The Q3 pricing page shipped on time and trial sign-ups are up. The checkout migration is blocked on a payment-provider review. Two new support hires start Monday.</div>
        </div>

        <div class="text">
            <span class="bold">Upcoming Deadlines:</span>
            <div class="text-content">Board deck draft due Thursday (Marcus).</div>
            <div class="text-content">Renew the staging SSL certificate before Friday.</div>
        </div>

        <div class="text">
            <span class="bold">Action Items:</span>
            <div class="text-content">Set up error monitoring for the mobile app (<span>Priya</span>).</div>
            <div class="text-content">Finish the checkout migration review (<span>Leo</span>).</div>
        </div>
        """,
        "is_premium": False,
        "prep_for": "Dana Whitfield",
        "prep_by": "FocusGate",
    }

    # Render template
    rendered_html = template.render(**test_data)
    assert "Good Monday!" in rendered_html

    # Optional: Save rendered HTML for manual inspection
    output_path = Path(__file__).parent / "test_output"
    output_path.mkdir(exist_ok=True)

    with open(output_path / "test_newsletter.html", "w", encoding="utf-8") as f:
        f.write(rendered_html)


def test_premium_newsletter_template():
    """Test rendering for premium users"""
    env = Environment(loader=FileSystemLoader(get_template_path()))
    template = env.get_template("newsletter.html")

    test_data = {
        "title": "Daily Executive Summary",
        "timestamp": datetime.now().strftime("%B %d, %Y"),
        "logo_data": LOGO_URL,
        "day_of_week": "Monday",
        "date": "January 10, 2025",
        "summary": """
            <p>Premium Executive Summary:</p>
            <p>1. Detailed Market Analysis: In-depth review of sector performance...</p>
            <p>2. Strategic Planning: Complete breakdown of Q1 2025 initiatives...</p>
            <p>3. Advanced Metrics: Comprehensive dashboard of all KPIs...</p>
        """,
        "is_premium": True,
    }

    rendered_html = template.render(**test_data)
    assert "Good Monday!" in rendered_html

    output_path = Path(__file__).parent / "test_output"
    output_path.mkdir(exist_ok=True)

    with open(output_path / "test_premium_newsletter.html", "w", encoding="utf-8") as f:
        f.write(rendered_html)
