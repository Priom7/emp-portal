import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Endpoints } from "@/lib/endpoints";
import type { RootState } from "@/store";

type RequestState = "idle" | "loading" | "succeeded" | "failed";

interface CheckIn {
  scanned: string;
  event_type: "In" | "Out";
  device_type: string;
  device_brand: string;
  screen_location: string;
}

interface AttendanceState {
  history: CheckIn[];
  totalRecords: number;
  status: RequestState;
  error: string | null;
}

const initialState: AttendanceState = {
  history: [],
  totalRecords: 0,
  status: "idle",
  error: null,
};

export const fetchClockHistory = createAsyncThunk<
  { check_ins: CheckIn[]; total_records: number },
  { page?: number; per_page?: number; scanned_by?: number },
  { rejectValue: string }
>("attendance/fetchClockHistory", async (params, { rejectWithValue }) => {
  try {
    const res = await Endpoints.clockHistory(params);
    if (res.data?.success === 1 && Array.isArray(res.data?.check_ins)) {
      return {
        check_ins: res.data.check_ins,
        total_records: res.data.total_records || res.data.check_ins.length,
      };
    }
    return rejectWithValue(res.data?.msg || "Unable to load clock history");
  } catch (err) {
    return rejectWithValue("Failed to load clock history");
  }
});

export const clockEvent = createAsyncThunk<void, Record<string, any>, { rejectValue: string }>(
  "attendance/clockEvent",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await Endpoints.clockEvent(payload);
      if (res.data?.success !== 1) {
        return rejectWithValue(res.data?.msg || "Clock event failed");
      }
    } catch (err) {
      return rejectWithValue("Clock event failed");
    }
  },
);

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {
    resetAttendance(state) {
      state.history = [];
      state.totalRecords = 0;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClockHistory.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchClockHistory.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.history = action.payload.check_ins;
        state.totalRecords = action.payload.total_records;
      })
      .addCase(fetchClockHistory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to load clock history";
      })
      .addCase(clockEvent.rejected, (state, action) => {
        state.error = action.payload || "Clock event failed";
      });
  },
});

export const { resetAttendance } = attendanceSlice.actions;
export const selectClockHistory = (state: RootState) => state.attendance.history;
export const selectClockStatus = (state: RootState) => state.attendance.status;
export const selectClockError = (state: RootState) => state.attendance.error;
export const selectClockTotal = (state: RootState) => state.attendance.totalRecords;

export default attendanceSlice.reducer;
