from datetime import datetime, date
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator

class ConsentBase(BaseModel):
    organisation: str = Field(..., min_length=1, max_length=255, description="Organisation name")
    service_name: str = Field(..., min_length=1, max_length=255, description="Service name")
    original_purpose: str = Field(..., min_length=1, max_length=20000, description="Original purpose text")
    data_categories: List[str] = Field(default_factory=list, description="Data categories")
    source_type: Literal["official_text", "user_summary"] = "official_text"
    consent_date: Optional[date] = None

    @field_validator("organisation", "service_name", "original_purpose")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Field cannot be empty or whitespace only")
        return s

class ConsentCreate(ConsentBase):
    pass

class ConsentListItem(ConsentBase):
    id: int
    created_at: datetime
    latest_risk: Optional[str] = None
    analyses_count: int = 0

    class Config:
        from_attributes = True

class EvidenceRead(BaseModel):
    id: int
    consent_id: int
    title: str
    evidence_type: str
    content: str
    source: Optional[str] = None
    content_hash: str
    submitted_at: datetime

    class Config:
        from_attributes = True

class AnalysisRead(BaseModel):
    id: int
    evidence_id: int
    consent_id: int
    mode: str  # rules-only | hybrid
    risk: str  # LOW | MEDIUM | HIGH | INSUFFICIENT_EVIDENCE
    original_purposes: List[str] = Field(default_factory=list)
    new_purposes: List[str] = Field(default_factory=list)
    data_categories_affected: List[str] = Field(default_factory=list)
    third_party_sharing: str = "unclear"  # yes | no | unclear
    evidence_quotes: List[str] = Field(default_factory=list)
    rule_signals: List[Dict[str, Any]] = Field(default_factory=list)
    explanation: str
    recommended_action: str
    statement_labels: Dict[str, Any] = Field(default_factory=dict)
    warnings: List[str] = Field(default_factory=list)
    created_at: datetime
    evidence_content: Optional[str] = None
    quote_spans: Optional[List[Dict[str, Any]]] = None
    consent_service_name: Optional[str] = None
    consent_organisation: Optional[str] = None
    consent_original_purpose: Optional[str] = None

    class Config:
        from_attributes = True

class ConsentDetail(ConsentBase):
    id: int
    created_at: datetime
    latest_risk: Optional[str] = None
    analyses_count: int = 0
    evidence: List[EvidenceRead] = Field(default_factory=list)
    analyses: List[AnalysisRead] = Field(default_factory=list)

    class Config:
        from_attributes = True

class EvidenceCreate(BaseModel):
    consent_id: int
    title: str = Field(..., min_length=1, max_length=255)
    evidence_type: Literal["email", "policy", "notification", "sms", "other"]
    content: str = Field(..., min_length=1, max_length=20000, description="Evidence content (max 20,000 characters)")
    source: Optional[str] = Field(None, max_length=500)

    @field_validator("title", "content")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Field cannot be empty or whitespace only")
        return s

class ClarificationResponse(BaseModel):
    subject: str
    body: str

class HealthResponse(BaseModel):
    status: str
    llm_available: bool
