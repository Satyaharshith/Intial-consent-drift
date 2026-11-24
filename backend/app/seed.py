import os
import hashlib
from datetime import date
from sqlalchemy.orm import Session
from app.db import SessionLocal, Base, engine
from app.models import ConsentRecord, Evidence, Analysis
from app.engine.pipeline import analyze

DEMO_DATA = [
    {
        "organisation": "ABC Education Foundation",
        "service_name": "ABC Scholarship Portal",
        "original_purpose": "Verify scholarship eligibility and communicate application updates.",
        "data_categories": ["name", "email", "phone", "family income"],
        "source_type": "official_text",
        "consent_date": date(2026, 1, 15),
        "evidence_items": [
            {
                "title": "Application Status Update Email",
                "evidence_type": "email",
                "source": "scholarships@abcfoundation.org",
                "content": "Dear applicant, your documents have been verified and your application status is now Under Review. We will email you about the next steps and interview scheduled shortly."
            },
            {
                "title": "Partner Marketing Notice",
                "evidence_type": "email",
                "source": "updates@abcfoundation.org",
                "content": "We may share your registered email address with selected advertising partners for promotional communication and exclusive partner offers."
            }
        ]
    },
    {
        "organisation": "TechHire Inc.",
        "service_name": "TechHire Jobs Portal",
        "original_purpose": "Use my resume and contact details to evaluate my job application.",
        "data_categories": ["name", "email", "phone", "resume"],
        "source_type": "user_summary",
        "consent_date": date(2026, 2, 1),
        "evidence_items": [
            {
                "title": "Platform Analytics Notification",
                "evidence_type": "notification",
                "source": "System Notification",
                "content": "To improve our services, we may use your profile information for analytics and share insights with trusted partners to enhance platform performance."
            },
            {
                "title": "Commercial Partner Course Email",
                "evidence_type": "email",
                "source": "promotions@techhire.jobs",
                "content": "Candidate contact details will be used to send promotional offers about partner courses and products directly to your registered email address."
            }
        ]
    },
    {
        "organisation": "LearnFast Education Ltd.",
        "service_name": "LearnFast Edtech",
        "original_purpose": "Provide online learning services and track course progress.",
        "data_categories": ["name", "email", "learning activity"],
        "source_type": "official_text",
        "consent_date": date(2026, 3, 10),
        "evidence_items": [
            {
                "title": "Terms of Service Section 4",
                "evidence_type": "policy",
                "source": "https://learnfast.io/terms",
                "content": "Your learning activity may be shared with selected third parties for additional purposes including external academic research and platform enhancement."
            },
            {
                "title": "Short Push Notification",
                "evidence_type": "notification",
                "source": "Mobile App Alert",
                "content": "Hello, please check the app."
            }
        ]
    }
]

def seed_database(db: Session = None) -> dict:
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        # Create all tables if not exist
        Base.metadata.create_all(bind=engine)

        created_consents = 0
        created_evidence = 0
        created_analyses = 0

        for item in DEMO_DATA:
            # Check if consent with same organisation & service already exists
            existing = db.query(ConsentRecord).filter(
                ConsentRecord.organisation == item["organisation"],
                ConsentRecord.service_name == item["service_name"]
            ).first()

            if existing:
                consent = existing
            else:
                consent = ConsentRecord(
                    organisation=item["organisation"],
                    service_name=item["service_name"],
                    original_purpose=item["original_purpose"],
                    data_categories=item["data_categories"],
                    source_type=item["source_type"],
                    consent_date=item["consent_date"]
                )
                db.add(consent)
                db.commit()
                db.refresh(consent)
                created_consents += 1

            for ev_data in item["evidence_items"]:
                # Check if evidence exists by content_hash
                content = ev_data["content"].strip()
                content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
                ev_existing = db.query(Evidence).filter(
                    Evidence.consent_id == consent.id,
                    Evidence.content_hash == content_hash
                ).first()

                if ev_existing:
                    continue

                evidence = Evidence(
                    consent_id=consent.id,
                    title=ev_data["title"],
                    evidence_type=ev_data["evidence_type"],
                    source=ev_data.get("source"),
                    content=content,
                    content_hash=content_hash
                )
                db.add(evidence)
                db.commit()
                db.refresh(evidence)
                created_evidence += 1

                # Run analysis
                analysis_res = analyze(consent=consent, evidence=evidence)
                analysis = Analysis(
                    evidence_id=evidence.id,
                    consent_id=consent.id,
                    mode=analysis_res["mode"],
                    risk=analysis_res["risk"],
                    original_purposes=analysis_res["original_purposes"],
                    new_purposes=analysis_res["new_purposes"],
                    data_categories_affected=analysis_res["data_categories_affected"],
                    third_party_sharing=analysis_res["third_party_sharing"],
                    evidence_quotes=analysis_res["evidence_quotes"],
                    rule_signals=analysis_res["rule_signals"],
                    explanation=analysis_res["explanation"],
                    recommended_action=analysis_res["recommended_action"],
                    statement_labels=analysis_res["statement_labels"],
                    warnings=analysis_res["warnings"]
                )
                db.add(analysis)
                db.commit()
                created_analyses += 1

        return {
            "status": "success",
            "message": f"Seeded successfully: {created_consents} consents, {created_evidence} evidence items, {created_analyses} analyses created."
        }
    finally:
        if should_close:
            db.close()

if __name__ == "__main__":
    res = seed_database()
    print(res)
