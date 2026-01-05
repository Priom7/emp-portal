import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { useEmployee } from "@/context/EmployeeProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchHolidayStats,
  selectHolidayStats,
  selectHolidayStatus,
  selectHolidayError,
} from "@/features/holidays/holidaySlice";
import {
  fetchClockHistory,
  selectClockHistory,
  selectClockStatus,
  selectClockError,
} from "@/features/attendance/attendanceSlice";
import axiosClient from "@/lib/axiosClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Bug } from "lucide-react";

type EndpointConfig = {
  path: string;
  method?: "get" | "post";
  description?: string;
  sample?: Record<string, any>;
};

// Compact list with sane defaults; still editable in UI.
const adminEndpoints: EndpointConfig[] = [
  { path: "hr-login.php", method: "get", sample: { portal_id: "employee", emp_id: 44001, password: "demo" } },
  { path: "hr-employee-holiday-update.php", method: "post", sample: { portal_id: "employee", portal_user: 44001, holiday_id: -1, hol_status: 1, start_date: "24/12/2025", end_date: "26/12/2025", holiday_year: 2025, employment: 1, created_by: 2 } },
  { path: "hr-employee-absence-update.php", method: "post", sample: { portal_id: "employee", portal_user: 44001, absence_type: 1, start_date: "01/01/2025", end_date: "02/01/2025" } },
  { path: "check-in-history.php", method: "get", sample: { portal_id: "employee", scanned_by: 44001, page: 1, per_page: 10 } },
  { path: "qr-code-update-event-manual.php", method: "post", sample: { portal_id: "employee", portal_user: 44001, team_member: 44001, event_type: "clock-in", screen_location: "HQ" } },
  { path: "holiday-entitlement-calculation.php", method: "get", sample: { employee_id: 44001, holiday_year: 2025 } },
  { path: "holiday-book-validation-response.php", method: "post", sample: { employee_id: 44001, start_date: "24/12/2025", end_date: "26/12/2025", holiday_year: 2025 } },
  { path: "holiday-request-response-update.php", method: "post", sample: { portal_id: "employee", portal_user: 44001, request_id: 1, response: 1 } },
  { path: "hr-employee-profile-update.php", method: "post", sample: { portal_id: "employee", portal_user: 44001, phone: "07700900000" } },
  { path: "hr-employee-employment-history.php", method: "get", sample: { portal_id: "employee", portal_user: 44001 } },
  { path: "hr-employee.php", method: "get", sample: { portal_id: "employee", portal_user: 44001 } },
  { path: "hr-upload-employee-document.php", method: "post", sample: { employee: 44001, uniq_file_name: "temp123.pdf", original_file_name: "sample.pdf" } },
  { path: "announcements.php", method: "get", sample: { portal_id: "employee" } },
  { path: "bank-holidays.php", method: "get", sample: {} },
  { path: "team-holidays-calendar.php", method: "get", sample: { portal_id: "employee", portal_user: 44001 } },
  { path: "my-team.php", method: "get", sample: { portal_id: "employee", portal_user: 44001 } },
  { path: "hr-forgot-password-match-token.php", method: "get", sample: { token: "DEMO-TOKEN" } },
  { path: "hr-reset-password.php", method: "post", sample: { password_1: "Password1", password_2: "Password1", token: "DEMO-TOKEN" } },
  { path: "change-password.php", method: "post", sample: { current_password: "OldPass1", password_1: "NewPass1", password_2: "NewPass1" } },
  { path: "hr-upload-employee-document.php", method: "post", sample: { employee: 44001, uniq_file_name: "temp123.pdf", original_file_name: "contract.pdf" } },
  { path: "qr-code-update-event.php", method: "post", sample: { team_member: 44001, device_id: "scanner-1" } },
  { path: "qr-clock.php", method: "post", sample: { team_member: 44001, event_type: "clock-in" } },
  { path: "hr-employee-immigration-history.php", method: "get", sample: { portal_user: 44001, portal_id: "employee" } },
  { path: "hr-employment-offer-accepted.php", method: "post", sample: { uniq_id: "OFFER123", signature_image: "sig.png" } },
  { path: "hr-employment-contract-accepted.php", method: "post", sample: { uniq_id: "CONTRACT123", signature_image: "sig.png" } },
  { path: "hr-employee-attendance.php", method: "get", sample: { portal_user: 44001 } },
  { path: "hr-lookup-table.php", method: "get", sample: { table: "departments" } },
  { path: "it-service.php", method: "get", sample: { portal_id: "employee" } },
  { path: "timesheet.php", method: "get", sample: { portal_id: "employee", portal_user: 44001, week: "2025-01-01" } },
  { path: "workplace-ip-pool.php", method: "get", sample: { workplace_id: 1 } },
];

export default function DevTools() {
  const { user } = useEmployee();
  const dispatch = useAppDispatch();

  const holidayStats = useAppSelector(selectHolidayStats);
  const holidayStatus = useAppSelector(selectHolidayStatus);
  const holidayError = useAppSelector(selectHolidayError);

  const clockHistory = useAppSelector(selectClockHistory);
  const clockStatus = useAppSelector(selectClockStatus);
  const clockError = useAppSelector(selectClockError);

  const [reqPath, setReqPath] = useState("/hr-login.php");
  const [reqMethod, setReqMethod] = useState<"get" | "post">("get");
  const [reqBody, setReqBody] = useState("{}");
  const [customBase, setCustomBase] = useState("");
  const [customApiKey, setCustomApiKey] = useState("4ccd42c6-4809-11ee-be56");
  const [withCreds, setWithCreds] = useState(true);
  const [reqResult, setReqResult] = useState<string>("");
  const [reqState, setReqState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointConfig>(adminEndpoints[0]);

  const client = useMemo(() => {
    const instance = axiosClient;
    if (customBase) instance.defaults.baseURL = customBase;
    instance.defaults.withCredentials = withCreds;
    return instance;
  }, [customBase, withCreds]);

  const triggerHoliday = () => dispatch(fetchHolidayStats());
  const triggerClock = () => dispatch(fetchClockHistory({ page: 1, per_page: 10 }));

  const handleSend = async () => {
    setReqState("loading");
    setReqResult("");
    try {
      const body = reqBody.trim() ? JSON.parse(reqBody) : {};
      const payload =
        reqMethod === "get"
          ? { params: { api_key: customApiKey, ...body } }
          : { ...body, api_key: customApiKey };

      const res =
        reqMethod === "get"
          ? await client.get(reqPath, payload as any)
          : await client.post(reqPath, payload);
      setReqResult(JSON.stringify(res.data, null, 2));
      setReqState("done");
    } catch (err: any) {
      setReqResult(err?.message || "Request failed");
      setReqState("error");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold">Developer API Playground</h1>
          <Badge variant="secondary">Dev only</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Inspect state, trigger thunks, and run ad-hoc API calls against the admin backend.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Auth / Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm font-mono break-words bg-muted/40 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold">User:</span>
                <Badge>{user?.user_id ?? "none"}</Badge>
              </div>
              <pre className="whitespace-pre-wrap text-xs">
                {JSON.stringify(user, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Holiday Stats</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{holidayStatus}</Badge>
                <Button size="sm" onClick={triggerHoliday}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {holidayError && (
                <div className="text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {holidayError}
                </div>
              )}
              <pre className="whitespace-pre-wrap text-xs bg-muted/40 rounded-lg p-3">
                {holidayStats ? JSON.stringify(holidayStats, null, 2) : "No data"}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Clock History</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{clockStatus}</Badge>
                <Button size="sm" onClick={triggerClock}>
                  Fetch page 1
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {clockError && (
                <div className="text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {clockError}
                </div>
              )}
              <pre className="whitespace-pre-wrap text-xs bg-muted/40 rounded-lg p-3 max-h-48 overflow-auto">
                {clockHistory.length ? JSON.stringify(clockHistory, null, 2) : "No records"}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ad-hoc API Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="md:col-span-2">
                  <Input
                    value={customBase}
                    onChange={(e) => setCustomBase(e.target.value)}
                    placeholder="Custom base URL (optional)"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="withCreds"
                    type="checkbox"
                    checked={withCreds}
                    onChange={(e) => setWithCreds(e.target.checked)}
                  />
                  <label htmlFor="withCreds" className="text-sm">
                    withCredentials
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="API Key"
                />
                <div className="col-span-2 flex gap-2">
                  <select
                    value={reqMethod}
                    onChange={(e) => setReqMethod(e.target.value as "get" | "post")}
                    className="border rounded-md px-2 py-1 text-sm"
                  >
                    <option value="get">GET</option>
                    <option value="post">POST</option>
                  </select>
                  <Input
                    value={reqPath}
                    onChange={(e) => setReqPath(e.target.value)}
                    placeholder="/hr-login.php"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="flex flex-col gap-2">
                  <select
                    value={selectedEndpoint.path}
                    onChange={(e) => {
                      const ep = adminEndpoints.find((item) => item.path === e.target.value);
                      if (ep) {
                        setSelectedEndpoint(ep);
                        setReqPath(`/${ep.path}`);
                        setReqMethod(ep.method || "get");
                        if (ep.sample) setReqBody(JSON.stringify(ep.sample, null, 2));
                      }
                    }}
                    className="border rounded-md px-2 py-1 text-sm w-full"
                  >
                    {adminEndpoints.map((ep) => (
                      <option key={ep.path} value={ep.path}>
                        {ep.path}
                      </option>
                    ))}
                  </select>
                  {selectedEndpoint.description && (
                    <p className="text-xs text-muted-foreground">{selectedEndpoint.description}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Textarea
                    value={reqBody}
                    onChange={(e) => setReqBody(e.target.value)}
                    placeholder='{"key":"value"}'
                    className="font-mono text-sm"
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleSend} disabled={reqState === "loading"}>
                  {reqState === "loading" ? "Sending..." : "Send"}
                </Button>
                <Badge variant="outline">{reqState}</Badge>
              </div>
              <pre className="whitespace-pre-wrap text-xs bg-muted/40 rounded-lg p-3 max-h-48 overflow-auto">
                {reqResult || "Response will appear here"}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
