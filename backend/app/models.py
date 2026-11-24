from datetime import datetime, timezone, date
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.db import Base

def utc_now():
    return datetime.now(timezone.utc)

class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id = Column(Integer, primary_key=True, index=True)
    organisation = Column(String(255), nullable=False)
    service_name = Column(String(255), nullable=False)
    original_purpose = Column(Text, nullable=False)
    data_categories = Column(JSON, default=list, nullable=False)  # list of strings
    source_type = Column(String(50), nullable=False, default="official_text")  # official_text | user_summary
    consent_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    evidence = relationship("Evidence", back_populates="consent", cascade="all, delete-orphan", order_by="Evidence.submitted_at.desc()")
    analyses = relationship("Analysis", back_populates="consent", cascade="all, delete-orphan", order_by="Analysis.created_at.desc()")

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    consent_id = Column(Integer, ForeignKey("consent_records.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    evidence_type = Column(String(50), nullable=False)  # email | policy | notification | sms | other
    content = Column(Text, nullable=False)  # stored exactly as submitted, never modified
    source = Column(String(500), nullable=True)  # sender or URL
    content_hash = Column(String(64), nullable=False)  # SHA-256 hex
    submitted_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    consent = relationship("ConsentRecord", back_populates="evidence")
    analyses = relationship("Analysis", back_populates="evidence", cascade="all, delete-orphan", order_by="Analysis.created_at.desc()")

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(Integer, ForeignKey("evidence.id", ondelete="CASCADE"), nullable=False)
    consent_id = Column(Integer, ForeignKey("consent_records.id", ondelete="CASCADE"), nullable=False)
    mode = Column(String(50), nullable=False)  # rules-only | hybrid
    risk = Column(String(50), nullable=False)  # LOW | MEDIUM | HIGH | INSUFFICIENT_EVIDENCE
    original_purposes = Column(JSON, default=list, nullable=False)  # list of strings
    new_purposes = Column(JSON, default=list, nullable=False)  # list of strings
    data_categories_affected = Column(JSON, default=list, nullable=False)  # list of strings
    third_party_sharing = Column(String(20), nullable=False, default="unclear")  # yes | no | unclear
    evidence_quotes = Column(JSON, default=list, nullable=False)  # list of exact strings
    rule_signals = Column(JSON, default=list, nullable=False)  # list of {signal, matched_text, ...}
    explanation = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    statement_labels = Column(JSON, default=dict, nullable=False)  # {directly_stated: [...], ai_interpretation: [...]}
    warnings = Column(JSON, default=list, nullable=False)  # list of strings
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    consent = relationship("ConsentRecord", back_populates="analyses")
    evidence = relationship("Evidence", back_populates="analyses")
