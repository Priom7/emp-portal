"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchClockHistory,
  selectClockHistory,
  selectClockStatus,
  selectClockError,
  selectClockTotal,
} from "@/features/attendance/attendanceSlice";
import { useEmployee } from "@/context/EmployeeProvider";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut, Smartphone, MapPin } from "lucide-react";
import { Layout } from "@/components/Layout";

export default function AttendancePage() {
  const dispatch = useAppDispatch();
  const { user } = useEmployee();

  const history = useAppSelector(selectClockHistory);
  const status = useAppSelector(selectClockStatus);
  const error = useAppSelector(selectClockError);
  const totalRecords = useAppSelector(selectClockTotal);

  const [page, setPage] = useState(1);
  const perPage = 10;

  /* ----------------------------------------------------
     FETCH ATTENDANCE (LIKE HOLIDAYS)
  ---------------------------------------------------- */
  useEffect(() => {
    if (!user?.user_id) return;

    dispatch(
      fetchClockHistory({
        scanned_by: user.user_id,
        page,
        per_page: perPage,
      })
    );
  }, [dispatch, page, perPage, user?.user_id]);

  /* ----------------------------------------------------
     STATES
  ---------------------------------------------------- */
  if (status === "loading") {
    return (
      <div className="text-sm text-muted-foreground">
        Loading attendance records…
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="text-sm text-red-600">
        {error || "Failed to load attendance"}
      </div>
    );
  }

  const lastEvent = history?.[0];

  /* ----------------------------------------------------
     RENDER
  ---------------------------------------------------- */
  return (
    <Layout>
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <p className="text-sm text-muted-foreground">
          View your clock-in and clock-out history
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last Action</CardDescription>
            <CardTitle className="flex items-center gap-2">
              {lastEvent?.event_type === "In" ? (
                <LogIn className="h-5 w-5 text-emerald-500" />
              ) : (
                <LogOut className="h-5 w-5 text-red-500" />
              )}
              {lastEvent?.event_type || "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {lastEvent?.scanned || "No activity recorded"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Records</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {totalRecords}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This period
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clock-In History</CardTitle>
          <CardDescription>
            All recorded check-ins and check-outs
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date &amp; Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-sm text-muted-foreground py-6"
                  >
                    No attendance records found
                  </TableCell>
                </TableRow>
              ) : (
                history.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {record.scanned}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          record.event_type === "In"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {record.event_type}
                      </Badge>
                    </TableCell>

                    <TableCell className="flex items-center gap-2 text-sm">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      {record.device_brand}
                    </TableCell>

                    <TableCell className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {record.screen_location}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>
              Page {page} · {totalRecords} records
            </span>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * perPage >= totalRecords}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </Layout>
  );
}
