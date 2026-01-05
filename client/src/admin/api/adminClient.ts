import axios from "axios";

export const ADMIN_API_BASE =
  (import.meta.env.VITE_ADMIN_API_BASE as string | undefined) ??
  "http://hr-admin.test/admin";

export const DEFAULT_ADMIN_API_KEY =
  (import.meta.env.VITE_ADMIN_API_KEY as string | undefined) ?? "4ccd42c6-4809-11ee-be56";

export const adminClient = axios.create({
  baseURL: ADMIN_API_BASE,
  withCredentials: true,
  headers: {
    "X-Requested-With": "XMLHttpRequest"
  }
});

export function withAdminKey<T extends Record<string, unknown>>(params: T, apiKey?: string) {
  return { api_key: apiKey ?? DEFAULT_ADMIN_API_KEY, ...params };
}
