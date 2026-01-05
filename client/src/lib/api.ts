// /lib/api.ts
export const API_BASE =
  (import.meta.env.VITE_EMPLOYEE_API_BASE as string | undefined) ??
  (import.meta.env.VITE_HR_ADMIN_API as string | undefined) ??
  "http://local-hr-admin.test";
// old v1
// Universal API wrapper
export async function api<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("employee_token")
      : null;

    const headers: HeadersInit = {
      "Accept": "application/json",
      ...(options.method !== "GET" && { "Content-Type": "application/json" }),
      ...(token && { "Authorization": `Bearer ${token}` })
    };

    const res = await fetch(`${API_BASE}/${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API Error: ${res.status} - ${text}`);
    }

    return res.json();
  } catch (error: any) {
    console.error("API CALL FAILED:", error);
    throw error;
  }
}

// Helper methods
export const API = {
  get: <T>(url: string) => api<T>(url, { method: "GET" }),
  post: <T>(url: string, body?: any) =>
    api<T>(url, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(url: string, body?: any) =>
    api<T>(url, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(url: string) => api<T>(url, { method: "DELETE" }),
};
