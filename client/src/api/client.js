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
      localStorage.removeItem('cuttrack_token');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    throw err;
  }
  return data;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getClientDate() {
  try {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return '';
  }
}

export function api(path, options = {}) {
  const { headers, retries = 1, ...rest } = options;
  const base = import.meta.env.VITE_API_URL || 'https://cuttracker-ozsg.onrender.com';
  const savedToken = typeof window !== 'undefined' ? localStorage.getItem('cuttrack_token') : null;
  const clientDate = getClientDate();
  const authHeaders = {
    ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
    ...(clientDate ? { 'x-client-date': clientDate } : {})
  };

  async function attempt(retriesLeft) {
    try {
      const response = await fetch(`${base}/api${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeaders, ...headers },
        ...rest
      });
      return await parseResponse(response);
    } catch (err) {
      // Only retry on network failures (server unreachable/cold start),
      // not on actual API errors (4xx/5xx already handled above)
      const isNetworkError = err instanceof TypeError;
      if (isNetworkError && retriesLeft > 0) {
        await sleep(3000);
        return attempt(retriesLeft - 1);
      }
      throw err;
    }
  }

  return attempt(retries);
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
