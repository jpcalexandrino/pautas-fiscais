const API_BASE = import.meta.env.VITE_API_URL;

function getAuthHeaders(includeJson = true): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function handleUnauthorized(response: Response): void {
  if (response.status !== 401) return;
  localStorage.removeItem('token');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
  throw new Error('Sessão expirada');
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(true),
      ...options.headers,
    },
  });

  handleUnauthorized(response);
  return response;
}

export async function apiUpload(endpoint: string, formData: FormData): Promise<Response> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: getAuthHeaders(false),
    body: formData,
  });

  handleUnauthorized(response);
  return response;
}
