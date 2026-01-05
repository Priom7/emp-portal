import { adminClient, withAdminKey } from "./adminClient";

export const adminEndpoints = {
  login(payload: { email: string; password: string; remember?: boolean }) {
    const body = new URLSearchParams();
    body.append("form_username", payload.email);
    body.append("form_password", payload.password);
    body.append("form_save", payload.remember ? "yes" : "no");

    return adminClient.post("/login.php", body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
  },

  authenticate(apiKey?: string) {
    return adminClient.get("/api-response/hr-lookup-table.php", {
      params: withAdminKey({ lookup_table: "hr_employee_status" }, apiKey)
    });
  },

  announcements(apiKey?: string) {
    return adminClient.get("/api-response/announcements.php", {
      params: withAdminKey({ portal_id: "employee", portal_user: 0 }, apiKey)
    });
  },

  bankHolidays(apiKey?: string) {
    const now = new Date();
    const year = now.getFullYear();
    return adminClient.get("/api-response/bank-holidays.php", {
      params: withAdminKey({ date_from: `01/01/${year}`, date_till: `31/12/${year}` }, apiKey)
    });
  },

  attendanceToday(apiKey?: string) {
    return adminClient.get("/api-response/check-in-history.php", {
      params: withAdminKey({ portal_id: "employee", date_from: "today", date_till: "today" }, apiKey)
    });
  },

  lookupTable(table: string, apiKey?: string) {
    return adminClient.get("/api-response/hr-lookup-table.php", {
      params: withAdminKey({ lookup_table: table }, apiKey)
    });
  }
};
