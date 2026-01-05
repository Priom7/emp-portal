import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Endpoints } from "@/lib/endpoints";
import type { RootState } from "@/store";

type RequestState = "idle" | "loading" | "succeeded" | "failed";

interface TeamState {
  members: any[];
  calendar: {
    holidays: any[];
    employees: any[];
    attendances: any[];
  };
  announcements: any[];
  membersStatus: RequestState;
  calendarStatus: RequestState;
  announcementsStatus: RequestState;
  error: string | null;
}

const initialState: TeamState = {
  members: [],
  calendar: { holidays: [], employees: [], attendances: [] },
  announcements: [],
  membersStatus: "idle",
  calendarStatus: "idle",
  announcementsStatus: "idle",
  error: null,
};

export const fetchTeam = createAsyncThunk<any[], { portal_user: number }, { rejectValue: string }>(
  "team/fetchTeam",
  async (params, { rejectWithValue }) => {
    try {
      const res = await Endpoints.myTeam({ portal_id: "employee", ...params });
      const payload = res.data;
      const list = Array.isArray(payload?.employees)
        ? payload.employees
        : Array.isArray(payload?.team)
          ? payload.team
          : [];
      if (payload?.success === 1 && list.length >= 0) {
        return list;
      }
      return rejectWithValue(payload?.error || "Unable to load team");
    } catch {
      return rejectWithValue("Unable to load team");
    }
  },
);

export const fetchTeamCalendar = createAsyncThunk<
  { holidays: any[]; employees: any[]; attendances: any[] },
  { portal_user: number },
  { rejectValue: string }
>("team/fetchTeamCalendar", async (params, { rejectWithValue }) => {
  try {
    const res = await Endpoints.teamCalendar({ portal_id: "employee", ...params });
    const payload = res.data;
    if (payload?.success === 1) {
      return {
        holidays: payload.holidays || [],
        employees: payload.employees || [],
        attendances: payload.attendances || [],
      };
    }
    return rejectWithValue(payload?.error || "Unable to load team calendar");
  } catch {
    return rejectWithValue("Unable to load team calendar");
  }
});

export const fetchAnnouncements = createAsyncThunk<any[], void, { rejectValue: string }>(
  "team/fetchAnnouncements",
  async (_, { rejectWithValue }) => {
    try {
      const res = await Endpoints.announcements();
      if (res.data?.success === 1 && Array.isArray(res.data?.announcements)) {
        return res.data.announcements;
      }
      return rejectWithValue(res.data?.error || "Unable to load announcements");
    } catch {
      return rejectWithValue("Unable to load announcements");
    }
  },
);

const teamSlice = createSlice({
  name: "team",
  initialState,
  reducers: {
    resetTeam(state) {
      state.members = [];
      state.calendar = { holidays: [], employees: [], attendances: [] };
      state.announcements = [];
      state.membersStatus = "idle";
      state.calendarStatus = "idle";
      state.announcementsStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeam.pending, (state) => {
        state.membersStatus = "loading";
        state.error = null;
      })
      .addCase(fetchTeam.fulfilled, (state, action) => {
        state.membersStatus = "succeeded";
        state.members = action.payload;
      })
      .addCase(fetchTeam.rejected, (state, action) => {
        state.membersStatus = "failed";
        state.error = action.payload || "Unable to load team";
      })
      .addCase(fetchTeamCalendar.pending, (state) => {
        state.calendarStatus = "loading";
      })
      .addCase(fetchTeamCalendar.fulfilled, (state, action) => {
        state.calendarStatus = "succeeded";
        state.calendar = action.payload;
      })
      .addCase(fetchTeamCalendar.rejected, (state, action) => {
        state.calendarStatus = "failed";
        state.error = action.payload || "Unable to load team calendar";
      })
      .addCase(fetchAnnouncements.pending, (state) => {
        state.announcementsStatus = "loading";
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.announcementsStatus = "succeeded";
        state.announcements = action.payload;
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.announcementsStatus = "failed";
        state.error = action.payload || "Unable to load announcements";
      });
  },
});

export const { resetTeam } = teamSlice.actions;
export const selectTeamMembers = (state: RootState) => state.team.members;
export const selectTeamCalendar = (state: RootState) => state.team.calendar;
export const selectTeamAnnouncements = (state: RootState) => state.team.announcements;
export const selectTeamStatus = (state: RootState) => state.team.membersStatus;
export const selectTeamError = (state: RootState) => state.team.error;

export default teamSlice.reducer;
