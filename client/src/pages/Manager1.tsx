import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useEmployee } from "@/context/EmployeeProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchTeam,
  fetchTeamCalendar,
  fetchAnnouncements,
  selectTeamMembers,
  selectTeamCalendar,
  selectTeamAnnouncements,
  selectTeamStatus,
  selectTeamError,
} from "@/features/team/teamSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Bell, AlertCircle } from "lucide-react";

export default function Manager() {
  const { user } = useEmployee();
  const dispatch = useAppDispatch();
  const isManager = true;
  const members = useAppSelector(selectTeamMembers);
  const calendarData = useAppSelector(selectTeamCalendar);
  const holidays = calendarData?.holidays || [];
  const announcements = useAppSelector(selectTeamAnnouncements);
  const status = useAppSelector(selectTeamStatus);
  const error = useAppSelector(selectTeamError);

  useEffect(() => {
    if (isManager) {
      const payload = { portal_user: user.user_id, team_member: user.team_member };
      dispatch(fetchTeam(payload));
      dispatch(fetchTeamCalendar(payload));
      dispatch(fetchAnnouncements());
    }
  }, [dispatch, user, isManager]);

  if (!isManager) {
    return (
      <Layout>
        <Card>
          <CardContent className="py-6">
            <p className="font-medium">Manager tools are not available for this account.</p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Manager Hub</h1>
          <Badge variant="secondary">Line Manager</Badge>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Team Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">{members.length}</div>
              <p className="text-sm text-muted-foreground">Direct reports</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Upcoming Team Holidays</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">{holidays.length}</div>
              <p className="text-sm text-muted-foreground">Events in calendar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">{announcements.length}</div>
              <p className="text-sm text-muted-foreground">Latest from admin</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Team Roster</CardTitle>
              </div>
              <Badge variant="outline">{status}</Badge>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-auto text-sm">
              {members.length === 0 ? (
                <p className="text-muted-foreground">No team data yet.</p>
              ) : (
                members.map((m: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 border rounded-lg bg-white"
                  >
                    <div>
                      <p className="font-medium">{m.name || m.employee_name || m.user_name || m.user_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.role || m.department || "Team member"}
                      </p>
                    </div>
                    <Badge variant="secondary">{m.status || m.hr_employment_status || "Active"}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Team Holidays</CardTitle>
              </div>
              <Button variant="ghost" size="sm">
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-auto text-sm">
              {holidays.length === 0 ? (
                <p className="text-muted-foreground">No holidays scheduled.</p>
              ) : (
                holidays.map((h: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 border rounded-lg bg-white"
                  >
                    <div>
                      <p className="font-medium">{h.name || h.employee_name || "Holiday"}</p>
                      <p className="text-xs text-muted-foreground">
                        {h.start_date || h.start} - {h.end_date || h.end}
                      </p>
                    </div>
                    <Badge>{h.status || h.type || "Planned"}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            ) : (
              announcements.map((a: any, idx: number) => (
                <div key={idx} className="p-3 border rounded-lg bg-white">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{a.title || a.name || "Announcement"}</p>
                    <Badge variant="secondary">{a.priority || "info"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {a.date || a.created_at || ""}
                  </p>
                  <p className="text-sm mt-1 text-foreground">{a.content || a.message || ""}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
