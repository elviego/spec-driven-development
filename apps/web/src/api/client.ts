import axios from 'axios';

const BASE_URL = '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sdd_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — clear token and redirect
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sdd_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth helpers
export const auth = {
  me: () => api.get('/auth/me').then(r => r.data),
  disconnectGitHub: () => api.delete('/auth/github').then(r => r.data),
};

// Specs
export const specs = {
  list: () => api.get('/specs').then(r => r.data),
  get: (id: string) => api.get(`/specs/${id}`).then(r => r.data),
  getPublic: (token: string) => api.get(`/specs/public/${token}`).then(r => r.data),
  create: (data: Partial<import('../types').Spec>) => api.post('/specs', data).then(r => r.data),
  update: (id: string, data: Partial<import('../types').Spec>) => api.put(`/specs/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/specs/${id}`).then(r => r.data),
  share: (id: string, email: string, can_edit: boolean) =>
    api.post(`/specs/${id}/shares`, { email, can_edit }).then(r => r.data),
  removeShare: (id: string, email: string) =>
    api.delete(`/specs/${id}/shares/${encodeURIComponent(email)}`).then(r => r.data),
};

// Wiki
export const wiki = {
  list: () => api.get('/wiki').then(r => r.data),
  get: (slug: string) => api.get(`/wiki/${slug}`).then(r => r.data),
  specTemplate: () => api.get('/wiki/templates/spec').then(r => r.data),
  example: () => api.get('/wiki/examples/payment-fraud').then(r => r.data),
};

// GitHub
export const github = {
  connect: (token: string) => api.post('/github/connect', { token }).then(r => r.data),
  repos: () => api.get('/github/repos').then(r => r.data),
  link: (spec_id: string, repo: string, branch: string) =>
    api.post('/github/link', { spec_id, repo, branch }).then(r => r.data),
  pushSpec: (spec_id: string) => api.post('/github/push-spec', { spec_id }).then(r => r.data),
};

// AI (streaming)
export function streamAIAssist(params: {
  spec_id: string;
  phase: string;
  prompt: string;
  token: string;
  onText: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}): () => void {
  const controller = new AbortController();

  fetch('/api/ai/assist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({ spec_id: params.spec_id, phase: params.phase, prompt: params.prompt }),
    signal: controller.signal,
  }).then(async (res) => {
    if (!res.ok) {
      params.onError(`HTTP ${res.status}`);
      return;
    }
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'text') params.onText(event.content);
            if (event.type === 'done') params.onDone();
            if (event.type === 'error') params.onError(event.message);
          } catch { /* ignore parse errors */ }
        }
      }
    }
  }).catch((err) => {
    if (err.name !== 'AbortError') params.onError(err.message);
  });

  return () => controller.abort();
}

export function streamAIGenerate(params: {
  spec_id: string;
  output_dir: string;
  tech_preferences?: string;
  token: string;
  onText: (text: string) => void;
  onFile: (path: string, size: number) => void;
  onDone: (jobId: string) => void;
  onError: (err: string) => void;
}): () => void {
  const controller = new AbortController();

  fetch('/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({
      spec_id: params.spec_id,
      output_dir: params.output_dir,
      tech_preferences: params.tech_preferences,
    }),
    signal: controller.signal,
  }).then(async (res) => {
    if (!res.ok) {
      params.onError(`HTTP ${res.status}`);
      return;
    }
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'text') params.onText(event.content);
            if (event.type === 'file') params.onFile(event.path, event.size);
            if (event.type === 'done') params.onDone(event.job_id);
            if (event.type === 'error') params.onError(event.message);
          } catch { /* ignore */ }
        }
      }
    }
  }).catch((err) => {
    if (err.name !== 'AbortError') params.onError(err.message);
  });

  return () => controller.abort();
}
