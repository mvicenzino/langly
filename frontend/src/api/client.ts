import { useAuthStore } from '../store/authStore';

// In dev, Vite proxy handles /api → localhost:5001
// In prod, VITE_API_URL points to the Railway backend
const BASE_URL = import.meta.env.VITE_API_URL || '';

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handle401(res: Response): Response {
  if (res.status === 401) {
    useAuthStore.getState().logout();
  }
  return res;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = handle401(
    await fetch(`${BASE_URL}${path}`, { headers: authHeaders() })
  );
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = handle401(
    await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    })
  );
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = handle401(
    await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    })
  );
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = handle401(
    await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  );
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
  return res.json();
}
