import { apiFetch, apiUpload } from '@/api/client';

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function parseJson<T = unknown>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function ensureOk(
  response: Response,
  fallbackMessage: string,
): Promise<Response> {
  if (response.ok) return response;

  const body = await response.json().catch(() => ({} as { error?: string }));
  throw new ApiError(body.error || fallbackMessage, response.status);
}

export async function apiJson<T = unknown>(
  endpoint: string,
  options?: RequestInit,
  fallbackMessage = 'Falha na requisição',
): Promise<T> {
  const response = await apiFetch(endpoint, options);
  await ensureOk(response, fallbackMessage);
  return parseJson<T>(response);
}

export async function apiUploadJson<T = unknown>(
  endpoint: string,
  formData: FormData,
  fallbackMessage = 'Falha no upload',
): Promise<T> {
  const response = await apiUpload(endpoint, formData);
  await ensureOk(response, fallbackMessage);
  return parseJson<T>(response);
}

export function hasAuthToken(): boolean {
  return !!localStorage.getItem('token');
}
