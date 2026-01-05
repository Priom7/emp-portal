export const EMPLOYEE_BASE_PATH = (import.meta.env.VITE_EMPLOYEE_BASE_PATH as string | undefined) ?? "/employee";
export const ADMIN_BASE_PATH = (import.meta.env.VITE_ADMIN_BASE_PATH as string | undefined) ?? "/admin";

export function withEmployeeBase(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (EMPLOYEE_BASE_PATH === "/") return normalized;
  const trimmed = EMPLOYEE_BASE_PATH.endsWith("/") ? EMPLOYEE_BASE_PATH.slice(0, -1) : EMPLOYEE_BASE_PATH;
  return `${trimmed}${normalized}`;
}

export function withAdminBase(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (ADMIN_BASE_PATH === "/") return normalized;
  const trimmed = ADMIN_BASE_PATH.endsWith("/") ? ADMIN_BASE_PATH.slice(0, -1) : ADMIN_BASE_PATH;
  return `${trimmed}${normalized}`;
}
