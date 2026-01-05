// client/src/hooks/useEmployee.ts
import { useEmployee as useEmployeeContext } from "@/context/EmployeeProvider";

// Keep hook API stable for components that import from hooks/
export function useEmployee() {
  return useEmployeeContext();
}
