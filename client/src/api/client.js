export class ApiError extends Error {
  constructor(message, status, issues) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.issues = issues || null;
  }
}

async function parseResponse(response) {
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    const message = data?.error || `Request failed (${response.status})`;
    const err = new ApiError(message, response.status, data?.issues);
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    throw err;
  }
  return data;
}

export function api(path, options = {}) {
  const { headers, ...rest } = options;
  const base = import.meta.env.VITE_API_URL ?? '';
  return fetch(`${base}/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
    ...rest
  }).then(parseResponse);
}

export function apiGet(path) {
  return api(path);
}

export function apiPost(path, body) {
  return api(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
}

export function apiPut(path, body) {
  return api(path, { method: 'PUT', body: JSON.stringify(body ?? {}) });
}

export function apiDelete(path) {
  return api(path, { method: 'DELETE' });
}
