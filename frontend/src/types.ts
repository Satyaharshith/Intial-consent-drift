export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'INSUFFICIENT_EVIDENCE';

export interface ConsentListItem {
  id: number;
  organisation: string;
  service_name: string;
  original_purpose: string;
  data_categories: string[];
  source_type: 'official_text' | 'user_summary';
  consent_date: string | null;
  created_at: string;
  latest_risk: RiskLevel | null;
  analyses_count: number;
}

export interface EvidenceRead {
  id: number;
  consent_id: number;
  title: string;
  evidence_type: 'email' | 'policy' | 'notification' | 'sms' | 'other';
  content: string;
  source: string | null;
  content_hash: string;
  submitted_at: string;
}

export interface QuoteSpan {
  start: number;
  end: number;
  quote: string;
}

export interface RuleSignal {
  signal: string;
  matched_text: string;
  category?: string;
  start?: number;
  end?: number;
}

export interface AnalysisRead {
  id: number;
  evidence_id: number;
  consent_id: number;
  mode: 'rules-only' | 'hybrid';
  risk: RiskLevel;
  original_purposes: string[];
  new_purposes: string[];
  data_categories_affected: string[];
  third_party_sharing: 'yes' | 'no' | 'unclear';
  evidence_quotes: string[];
  rule_signals: RuleSignal[];
  explanation: string;
  recommended_action: string;
  statement_labels: {
    directly_stated: string[];
    ai_interpretation: string[];
  };
  warnings: string[];
  created_at: string;
  evidence_content?: string;
  quote_spans?: QuoteSpan[];
  consent_service_name?: string;
  consent_organisation?: string;
  consent_original_purpose?: string;
}

export interface ConsentDetail extends ConsentListItem {
  evidence: EvidenceRead[];
  analyses: AnalysisRead[];
}

export interface ConsentCreateInput {
  organisation: string;
  service_name: string;
  original_purpose: string;
  data_categories: string[];
  source_type: 'official_text' | 'user_summary';
  consent_date?: string | null;
}

export interface EvidenceCreateInput {
  consent_id: number;
  title: string;
  evidence_type: 'email' | 'policy' | 'notification' | 'sms' | 'other';
  content: string;
  source?: string | null;
}

export interface ClarificationResponse {
  subject: string;
  body: string;
}

export interface HealthResponse {
  status: string;
  llm_available: boolean;
}

export interface EvalPerClassMetric {
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface EvalModeResult {
  total: number;
  accuracy: number;
  confusion_matrix: Record<string, Record<string, number>>;
  per_class: Record<string, EvalPerClassMetric>;
  false_high_count: number;
}

export interface EvalResultsResponse {
  status?: string;
  message?: string;
  generated_at?: string;
  sample_count?: number;
  metrics?: {
    rules_only: EvalModeResult;
    hybrid?: EvalModeResult | null;
  };
}
