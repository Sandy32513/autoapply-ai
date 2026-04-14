import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function fetchWithAuth(endpoint: string, options: FetchOptions = {}) {
  let token = null;
  
  try {
    const { data } = await supabase.auth.getSession();
    token = data?.session?.access_token;
  } catch {
    console.warn('No auth session');
  }

  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const resumeApi = {
  getAll: () => fetchWithAuth('/api/resumes'),

  getById: (id: string) => fetchWithAuth(`/api/resumes/${id}`),

  upload: async (file: File) => {
    let token = null;
    
    try {
      const { data } = await supabase.auth.getSession();
      token = data?.session?.access_token;
    } catch {
      console.warn('No auth session');
    }

    const response = await fetch(`${API_URL}/api/resumes/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: file,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },

  tailor: async (resumeId: string, jobDescription: string) => {
    return fetchWithAuth('/api/resumes/tailor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resumeId, jobDescription }),
    });
  },

  getTailored: () => fetchWithAuth('/api/resumes/tailored'),
};

export const jobApi = {
  getAll: (params: { page?: number; limit?: number; search?: string; location?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.search) query.set('search', params.search);
    if (params.location) query.set('location', params.location);
    return fetchWithAuth(`/api/jobs?${query.toString()}`);
  },

  getById: (id: string) => fetchWithAuth(`/api/jobs/${id}`),

  scrape: (keywords: string, location: string) => {
    return fetchWithAuth('/api/jobs/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keywords, location }),
    });
  },
};

export const applicationApi = {
  getAll: () => fetchWithAuth('/api/applications'),
  
  getById: (id: string) => fetchWithAuth(`/api/applications/${id}`),
  
  apply: (jobId: string, resumeId?: string) => {
    return fetchWithAuth('/api/applications/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobId, resumeId }),
    });
  },
  
  getQueueStatus: () => fetchWithAuth('/api/applications/queue/status'),
};