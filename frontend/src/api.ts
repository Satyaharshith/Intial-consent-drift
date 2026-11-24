import {
  ConsentListItem,
  ConsentDetail,
  ConsentCreateInput,
  EvidenceCreateInput,
  AnalysisRead,
  ClarificationResponse,
  HealthResponse,
  EvalResultsResponse
} from './types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Request failed (${res.status} ${res.statusText})`;
    try {
      const data = await res.json();
      if (data.detail) {
        errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      // fallback to statusText
    }
    throw new Error(errorMsg);
  }
  if (res.status === 204) {
    return null as unknown as T;
  }
  return res.json();
}

export const api = {
  getHealth: async (): Promise<HealthResponse> => {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<HealthResponse>(res);
  },

  listConsents: async (): Promise<ConsentListItem[]> => {
    const res = await fetch(`${API_BASE}/consents`);
    return handleResponse<ConsentListItem[]>(res);
  },

  getConsent: async (id: number): Promise<ConsentDetail> => {
    const res = await fetch(`${API_BASE}/consents/${id}`);
    return handleResponse<ConsentDetail>(res);
  },

  createConsent: async (payload: ConsentCreateInput): Promise<ConsentDetail> => {
    const res = await fetch(`${API_BASE}/consents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<ConsentDetail>(res);
  },

  deleteConsent: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/consents/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },

  exportConsent: async (id: number): Promise<any> => {
    const res = await fetch(`${API_BASE}/consents/${id}/export`);
    return handleResponse<any>(res);
  },

  submitEvidence: async (payload: EvidenceCreateInput): Promise<AnalysisRead> => {
    const res = await fetch(`${API_BASE}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<AnalysisRead>(res);
  },

  getAnalysis: async (id: number): Promise<AnalysisRead> => {
    const res = await fetch(`${API_BASE}/analyses/${id}`);
    return handleResponse<AnalysisRead>(res);
  },

  generateClarification: async (analysisId: number): Promise<ClarificationResponse> => {
    const res = await fetch(`${API_BASE}/analyses/${analysisId}/clarification`, {
      method: 'POST',
    });
    return handleResponse<ClarificationResponse>(res);
  },

  seedDemo: async (): Promise<{ status: string; message: string }> => {
    const res = await fetch(`${API_BASE}/seed`, {
      method: 'POST',
    });
    return handleResponse<{ status: string; message: string }>(res);
  },

  getEvalResults: async (): Promise<EvalResultsResponse> => {
    const res = await fetch(`${API_BASE}/eval/results`);
    return handleResponse<EvalResultsResponse>(res);
  },
};
