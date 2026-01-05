// src/lib/endpoints.ts
import axiosClient from "./axiosClient";

const API_KEY = "4ccd42c6-4809-11ee-be56";

export const Endpoints = {
  // --- Auth ---
  employeeLogin(empId: number, password: string) {
    return axiosClient.get("/hr-login.php", {
      params: {
        api_key: API_KEY,
        portal_id: "employee",
        emp_id: empId,
        password,
      },
    });
  },

  changePassword(payload: { current_password: string; password_1: string; password_2: string }) {
    return axiosClient.post("/change-password.php", payload);
  },

  forgotPassword(payload: { email: string; portal: "employee" }) {
    return axiosClient.post("/hr-employee-forgot-password.php", payload);
  },

  resetPassword(payload: {
    token: string;
    password_1: string;
    password_2: string;
  }) {
    return axiosClient.post("/hr-reset-password.php", payload);
  },

  // --- Holidays ---
  myHolidays() {
    return axiosClient.get("/employee-holidays.php", {
      params: { api_key: API_KEY },
    });
  },

  holidayEntitlement(params: { holiday_year: number; employee_id?: number }) {
    return axiosClient.get("/holiday-entitlement-calculation.php", {
      params: { api_key: API_KEY, ...params },
    });
  },

  announcements() {
    return axiosClient.get("/announcements.php", {
      params: { api_key: API_KEY, portal_id: "employee" },
    });
  },

  validateHoliday(payload: { start_date: string; end_date: string; holiday_year: number }) {
    return axiosClient.post("/holiday-book-validation-response.php", payload);
  },

  submitHoliday(payload: Record<string, any>) {
    // expects: start_date, end_date, holiday_year, employment (id), etc.
    return axiosClient.post("/hr-employee-holiday-update.php", payload);
  },

  holidayHistory(params: { holiday_year?: number }) {
    return axiosClient.get("/hr-employee-holiday-history.php", {
      params: { api_key: API_KEY, ...params },
    });
  },

  respondHoliday(payload: { request_id: number; response: number }) {
    return axiosClient.post("/holiday-request-response-update.php", payload);
  },

  // --- Absences ---
  submitAbsence(payload: Record<string, any>) {
    return axiosClient.post("/hr-employee-absence-update.php", payload);
  },

  // --- Attendance ---
  clockHistory(params: { page?: number; per_page?: number; team_member?: number }) {
    return axiosClient.get("/check-in-history.php", {
      params: {
        api_key: API_KEY,
        portal_id: "employee",
        ...params,
      },
    });
  },

  clockEvent(payload: Record<string, any>) {
    // qr-code-update-event.php (auto) or manual variant; we hit manual to allow team_member override
    return axiosClient.post("/qr-code-update-event-manual.php", payload);
  },

  // --- Team / Manager ---
  myTeam(params: Record<string, any>) {
    return axiosClient.get("/my-team.php", { params: { api_key: API_KEY, ...params } });
  },

  teamCalendar(params: Record<string, any>) {
    return axiosClient.get("/team-holidays-calendar.php", { params: { api_key: API_KEY, ...params } });
  },

  // --- Profile ---
  updateProfile(payload: Record<string, any>) {
    return axiosClient.post("/hr-employee-profile-update.php", payload);
  },

  // --- Documents ---
  uploadDocument(formData: FormData) {
    return axiosClient.post("/hr-upload-employee-document.php", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // --- Offers / Consent / Contracts ---
  employmentOfferAccept(payload: Record<string, any>) {
    return axiosClient.post("/hr-employment-offer-accepted.php", payload);
  },

  employmentOfferReject(payload: Record<string, any>) {
    return axiosClient.post("/hr-employment-offer-rejected.php", payload);
  },

  employmentContractAccept(payload: Record<string, any>) {
    return axiosClient.post("/hr-employment-contract-accepted.php", payload);
  },

  biometricConsent(payload: Record<string, any>) {
    return axiosClient.post("/biometric-data-consent-signed.php", payload);
  },

  // --- Session helper (local only) ---
  me() {
    const saved = localStorage.getItem("employee_user");
    if (!saved) return Promise.reject("No session");
    return Promise.resolve({ data: JSON.parse(saved) });
  },

  hrEmployee(params: { portal_user: number; portal_id?: string }) {
    return axiosClient.get("/hr-employee.php", {
      params: { api_key: API_KEY, portal_id: "employee", ...params },
    });
  },

  hrEmployeeEmploymentHistory(params: { portal_user: number; portal_id?: string }) {
    return axiosClient.get("/hr-employee-employment-history.php", {
      params: { api_key: API_KEY, portal_id: "employee", ...params },
    });
  },

};
