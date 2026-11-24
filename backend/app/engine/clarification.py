from typing import Dict, Any, Optional

def generate_clarification_email(
    service_name: str,
    organisation: str,
    original_purpose: str,
    evidence_type: str,
    evidence_source: Optional[str],
    evidence_date: Optional[str],
    evidence_quotes: list,
    data_categories: list,
) -> Dict[str, str]:
    """
    Generate an editable plain-text clarification request email.
    Tone: neutral, polite, non-accusatory.
    """
    subject = f"Request for clarification about use of my personal data - {service_name}"

    source_info = f" ({evidence_source})" if evidence_source else ""
    date_info = f" received on {evidence_date}" if evidence_date else ""
    quote_section = ""
    if evidence_quotes:
        quote_section = "In particular, the following statement was noted:\n" + "\n".join(
            [f'  > "{q}"' for q in evidence_quotes]
        )
    else:
        quote_section = "In particular, newly received disclosures mention secondary processing of user information."

    categories_str = ", ".join(data_categories) if data_categories else "my account information"

    body = f"""Dear Privacy Team at {organisation},

I am writing to request clarification regarding the processing of my personal data in connection with {service_name}.

When I originally registered and provided consent, the stated purpose of processing was:
"{original_purpose.strip()}"

Recently, I received a {evidence_type}{source_info}{date_info} indicating additional data practices.
{quote_section}

Given that this appears to involve personal data categories such as {categories_str}, I would appreciate clarification on the following points:

1. For what specific purpose is the additional use mentioned?
2. Which of my personal data categories are involved?
3. Is my information shared with third parties? If so, which categories of recipients?
4. On what basis is this additional use carried out?
5. What choices do I have to opt out or withdraw consent?

I would appreciate your written response to these queries at your earliest convenience so that I can better understand how my personal data is being used.

Thank you for your time and assistance.

Sincerely,
[Your Name]
[Your Account Email / Username]
"""

    return {
        "subject": subject,
        "body": body
    }
