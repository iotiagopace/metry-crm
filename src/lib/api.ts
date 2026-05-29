import { BASE_URL, ANON_KEY } from "./supabase";

function getToken() {
  return localStorage.getItem("crm_token");
}

function getTenantId() {
  try {
    const user = JSON.parse(localStorage.getItem("crm_user") ?? "null") as { tenant_id?: string } | null;
    return user?.tenant_id;
  } catch {
    return undefined;
  }
}

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const tenantId = getTenantId();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : `Bearer ${ANON_KEY}`,
      ...(tenantId ? { "X-Tenant-Id": tenantId } : {}),
      ...(options.headers as Record<string, string>),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  return data as T;
}

export const get = <T>(path: string) => api<T>(path);
export const post = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(body) });
export const put = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PUT", body: JSON.stringify(body) });
export const del = <T>(path: string) => api<T>(path, { method: "DELETE" });
