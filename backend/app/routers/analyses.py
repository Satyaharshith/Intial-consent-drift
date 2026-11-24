from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Analysis, Evidence, ConsentRecord
from app.schemas import AnalysisRead, ClarificationResponse
from app.engine.validator import find_quote_span
from app.engine.clarification import generate_clarification_email

router = APIRouter(prefix="/api/analyses", tags=["analyses"])

@router.get("/{analysis_id}", response_model=AnalysisRead)
def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    evidence = db.query(Evidence).filter(Evidence.id == analysis.evidence_id).first()
    consent = db.query(ConsentRecord).filter(ConsentRecord.id == analysis.consent_id).first()

    # Compute quote spans for UI highlighting
    quote_spans = []
    if evidence and evidence.content and analysis.evidence_quotes:
        for q in analysis.evidence_quotes:
            span = find_quote_span(q, evidence.content)
            if span:
                quote_spans.append({
                    "start": span[0],
                    "end": span[1],
                    "quote": span[2]
                })

    return AnalysisRead(
        id=analysis.id,
        evidence_id=analysis.evidence_id,
        consent_id=analysis.consent_id,
        mode=analysis.mode,
        risk=analysis.risk,
        original_purposes=analysis.original_purposes,
        new_purposes=analysis.new_purposes,
        data_categories_affected=analysis.data_categories_affected,
        third_party_sharing=analysis.third_party_sharing,
        evidence_quotes=analysis.evidence_quotes,
        rule_signals=analysis.rule_signals,
        explanation=analysis.explanation,
        recommended_action=analysis.recommended_action,
        statement_labels=analysis.statement_labels,
        warnings=analysis.warnings,
        created_at=analysis.created_at,
        evidence_content=evidence.content if evidence else None,
        quote_spans=quote_spans,
        consent_service_name=consent.service_name if consent else None,
        consent_organisation=consent.organisation if consent else None,
        consent_original_purpose=consent.original_purpose if consent else None
    )

@router.post("/{analysis_id}/clarification", response_model=ClarificationResponse)
def get_clarification(analysis_id: int, db: Session = Depends(get_db)):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    evidence = db.query(Evidence).filter(Evidence.id == analysis.evidence_id).first()
    consent = db.query(ConsentRecord).filter(ConsentRecord.id == analysis.consent_id).first()

    if not consent or not evidence:
        raise HTTPException(status_code=404, detail="Associated consent or evidence record missing.")

    email_data = generate_clarification_email(
        service_name=consent.service_name,
        organisation=consent.organisation,
        original_purpose=consent.original_purpose,
        evidence_type=evidence.evidence_type,
        evidence_source=evidence.source,
        evidence_date=evidence.submitted_at.strftime("%Y-%m-%d") if evidence.submitted_at else None,
        evidence_quotes=analysis.evidence_quotes or [],
        data_categories=analysis.data_categories_affected or consent.data_categories or []
    )

    return ClarificationResponse(
        subject=email_data["subject"],
        body=email_data["body"]
    )
