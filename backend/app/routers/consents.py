from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import ConsentRecord, Evidence, Analysis
from app.schemas import ConsentCreate, ConsentListItem, ConsentDetail

router = APIRouter(prefix="/api/consents", tags=["consents"])

@router.post("", response_model=ConsentDetail, status_code=status.HTTP_201_CREATED)
def create_consent(payload: ConsentCreate, db: Session = Depends(get_db)):
    consent = ConsentRecord(
        organisation=payload.organisation,
        service_name=payload.service_name,
        original_purpose=payload.original_purpose,
        data_categories=payload.data_categories,
        source_type=payload.source_type,
        consent_date=payload.consent_date
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)
    return consent

@router.get("", response_model=List[ConsentListItem])
def list_consents(db: Session = Depends(get_db)):
    consents = db.query(ConsentRecord).order_by(ConsentRecord.created_at.desc()).all()
    results = []
    for c in consents:
        # Get latest analysis risk if any
        latest_analysis = (
            db.query(Analysis)
            .filter(Analysis.consent_id == c.id)
            .order_by(Analysis.created_at.desc())
            .first()
        )
        analyses_count = db.query(Analysis).filter(Analysis.consent_id == c.id).count()
        results.append(
            ConsentListItem(
                id=c.id,
                organisation=c.organisation,
                service_name=c.service_name,
                original_purpose=c.original_purpose,
                data_categories=c.data_categories or [],
                source_type=c.source_type,
                consent_date=c.consent_date,
                created_at=c.created_at,
                latest_risk=latest_analysis.risk if latest_analysis else None,
                analyses_count=analyses_count
            )
        )
    return results

@router.get("/{consent_id}", response_model=ConsentDetail)
def get_consent(consent_id: int, db: Session = Depends(get_db)):
    consent = db.query(ConsentRecord).filter(ConsentRecord.id == consent_id).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent record not found")
    
    latest_analysis = (
        db.query(Analysis)
        .filter(Analysis.consent_id == consent.id)
        .order_by(Analysis.created_at.desc())
        .first()
    )
    analyses_count = db.query(Analysis).filter(Analysis.consent_id == consent.id).count()

    detail = ConsentDetail(
        id=consent.id,
        organisation=consent.organisation,
        service_name=consent.service_name,
        original_purpose=consent.original_purpose,
        data_categories=consent.data_categories or [],
        source_type=consent.source_type,
        consent_date=consent.consent_date,
        created_at=consent.created_at,
        latest_risk=latest_analysis.risk if latest_analysis else None,
        analyses_count=analyses_count,
        evidence=consent.evidence,
        analyses=consent.analyses
    )
    return detail

@router.delete("/{consent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_consent(consent_id: int, db: Session = Depends(get_db)):
    consent = db.query(ConsentRecord).filter(ConsentRecord.id == consent_id).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent record not found")
    db.delete(consent)
    db.commit()
    return None

@router.get("/{consent_id}/export")
def export_consent(consent_id: int, db: Session = Depends(get_db)):
    consent = db.query(ConsentRecord).filter(ConsentRecord.id == consent_id).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent record not found")

    evidence_data = []
    for e in consent.evidence:
        evidence_data.append({
            "id": e.id,
            "title": e.title,
            "evidence_type": e.evidence_type,
            "content": e.content,
            "source": e.source,
            "content_hash": e.content_hash,
            "submitted_at": e.submitted_at.isoformat() if e.submitted_at else None
        })

    analyses_data = []
    for a in consent.analyses:
        analyses_data.append({
            "id": a.id,
            "evidence_id": a.evidence_id,
            "mode": a.mode,
            "risk": a.risk,
            "original_purposes": a.original_purposes,
            "new_purposes": a.new_purposes,
            "data_categories_affected": a.data_categories_affected,
            "third_party_sharing": a.third_party_sharing,
            "evidence_quotes": a.evidence_quotes,
            "rule_signals": a.rule_signals,
            "explanation": a.explanation,
            "recommended_action": a.recommended_action,
            "statement_labels": a.statement_labels,
            "warnings": a.warnings,
            "created_at": a.created_at.isoformat() if a.created_at else None
        })

    return {
        "consent_record": {
            "id": consent.id,
            "organisation": consent.organisation,
            "service_name": consent.service_name,
            "original_purpose": consent.original_purpose,
            "data_categories": consent.data_categories,
            "source_type": consent.source_type,
            "consent_date": consent.consent_date.isoformat() if consent.consent_date else None,
            "created_at": consent.created_at.isoformat() if consent.created_at else None
        },
        "evidence": evidence_data,
        "analyses": analyses_data
    }
