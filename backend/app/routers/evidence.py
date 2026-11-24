import hashlib
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import ConsentRecord, Evidence, Analysis
from app.schemas import EvidenceCreate, AnalysisRead
from app.engine.pipeline import analyze

router = APIRouter(prefix="/api/evidence", tags=["evidence"])

@router.post("", response_model=AnalysisRead, status_code=status.HTTP_201_CREATED)
def submit_evidence(payload: EvidenceCreate, db: Session = Depends(get_db)):
    # 1. Validate consent exists
    consent = db.query(ConsentRecord).filter(ConsentRecord.id == payload.consent_id).first()
    if not consent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Consent record with id {payload.consent_id} not found."
        )

    # 2. Content validations
    content = payload.content.strip()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Evidence content cannot be empty or whitespace only."
        )
    if len(content) > 20000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Evidence content exceeds 20,000 characters limit ({len(content)} chars submitted)."
        )

    # 3. Compute SHA-256 hash
    content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()

    # 4. Store evidence exactly as submitted
    evidence = Evidence(
        consent_id=consent.id,
        title=payload.title.strip(),
        evidence_type=payload.evidence_type,
        content=content,
        source=payload.source.strip() if payload.source else None,
        content_hash=content_hash
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    # 5. Run analysis engine pipeline
    analysis_dict = analyze(consent=consent, evidence=evidence)

    # 6. Store analysis in database
    analysis_record = Analysis(
        evidence_id=evidence.id,
        consent_id=consent.id,
        mode=analysis_dict["mode"],
        risk=analysis_dict["risk"],
        original_purposes=analysis_dict["original_purposes"],
        new_purposes=analysis_dict["new_purposes"],
        data_categories_affected=analysis_dict["data_categories_affected"],
        third_party_sharing=analysis_dict["third_party_sharing"],
        evidence_quotes=analysis_dict["evidence_quotes"],
        rule_signals=analysis_dict["rule_signals"],
        explanation=analysis_dict["explanation"],
        recommended_action=analysis_dict["recommended_action"],
        statement_labels=analysis_dict["statement_labels"],
        warnings=analysis_dict["warnings"]
    )
    db.add(analysis_record)
    db.commit()
    db.refresh(analysis_record)

    # 7. Format response
    response_data = AnalysisRead(
        id=analysis_record.id,
        evidence_id=analysis_record.evidence_id,
        consent_id=analysis_record.consent_id,
        mode=analysis_record.mode,
        risk=analysis_record.risk,
        original_purposes=analysis_record.original_purposes,
        new_purposes=analysis_record.new_purposes,
        data_categories_affected=analysis_record.data_categories_affected,
        third_party_sharing=analysis_record.third_party_sharing,
        evidence_quotes=analysis_record.evidence_quotes,
        rule_signals=analysis_record.rule_signals,
        explanation=analysis_record.explanation,
        recommended_action=analysis_record.recommended_action,
        statement_labels=analysis_record.statement_labels,
        warnings=analysis_record.warnings,
        created_at=analysis_record.created_at,
        evidence_content=evidence.content,
        quote_spans=analysis_dict.get("quote_spans", []),
        consent_service_name=consent.service_name,
        consent_organisation=consent.organisation,
        consent_original_purpose=consent.original_purpose
    )
    return response_data
