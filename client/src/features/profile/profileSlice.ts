import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Endpoints } from "@/lib/endpoints";
import type { RootState } from "@/store";

type RequestState = "idle" | "loading" | "succeeded" | "failed";

interface ProfileState {
  employee: any | null;
  status: RequestState;
  error: string | null;

  history: any[];
  historyStatus: RequestState;
  historyError: string | null;

  holidayRequests: any[];
  absences: any[];
}

const initialState: ProfileState = {
  employee: null,
  status: "idle",
  error: null,

  history: [],
  historyStatus: "idle",
  historyError: null,

  holidayRequests: [],
  absences: [],
};

// --------------------------------------------------------
// FETCH EMPLOYEE PROFILE
// --------------------------------------------------------
export const fetchEmployeeProfile = createAsyncThunk<
  any,
  { portal_user: number; portal_id?: string },
  { rejectValue: string }
>("profile/fetchEmployeeProfile", async (params, { rejectWithValue }) => {
  try {
    const res = await Endpoints.hrEmployee(params);

    if (res.data?.success === 1) {
      const payload = res.data;

      // Merge model:
      // - payload.employee (main)
      // - payload.employmentHistory
      // - payload.holidayRequests
      // - payload.absences

      return {
        employee: payload.employee || null,
        employmentHistory: payload.employmentHistory || [],
        holidayRequests: payload.holidayRequests || [],
        absences: payload.absences || [],
      };
    }

    return rejectWithValue(res.data?.error || "Unable to load profile");
  } catch (err) {
    return rejectWithValue("Unable to load profile");
  }
});

// --------------------------------------------------------
// FETCH EMPLOYMENT HISTORY (Separate Endpoint)
// --------------------------------------------------------
export const fetchEmploymentHistory = createAsyncThunk<
  any[],
  { portal_user: number; portal_id?: string },
  { rejectValue: string }
>("profile/fetchEmploymentHistory", async (params, { rejectWithValue }) => {
  try {
    const res = await Endpoints.hrEmployeeEmploymentHistory(params);

    if (res.data?.success === 1 && Array.isArray(res.data?.employment_history)) {
      return res.data.employment_history;
    }

    return rejectWithValue(res.data?.msg || res.data?.error || "Unable to load employment history");
  } catch (err) {
    return rejectWithValue("Unable to load employment history");
  }
});

// --------------------------------------------------------
// SLICE
// --------------------------------------------------------
const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    resetProfile(state) {
      state.employee = null;
      state.status = "idle";
      state.error = null;

      state.history = [];
      state.historyStatus = "idle";
      state.historyError = null;

      state.holidayRequests = [];
      state.absences = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // --------------------------------------------------
      // EMPLOYEE PROFILE
      // --------------------------------------------------
      .addCase(fetchEmployeeProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchEmployeeProfile.fulfilled, (state, action) => {
        state.status = "succeeded";

        // Primary employee object
        state.employee = action.payload.employee;

        // Merge in attached employment history (if present)
        if (action.payload.employmentHistory?.length) {
          state.history = action.payload.employmentHistory;
        }

        // Additional data
        state.holidayRequests = action.payload.holidayRequests || [];
        state.absences = action.payload.absences || [];
      })
      .addCase(fetchEmployeeProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Unable to load profile";
      })

      // --------------------------------------------------
      // EMPLOYMENT HISTORY (Separate Endpoint)
      // --------------------------------------------------
      .addCase(fetchEmploymentHistory.pending, (state) => {
        state.historyStatus = "loading";
        state.historyError = null;
      })
      .addCase(fetchEmploymentHistory.fulfilled, (state, action) => {
        state.historyStatus = "succeeded";
        state.history = action.payload;
      })
      .addCase(fetchEmploymentHistory.rejected, (state, action) => {
        state.historyStatus = "failed";
        state.historyError = action.payload || "Unable to load employment history";
        state.history = [];
      });
  },
});

// --------------------------------------------------------
// EXPORTS
// --------------------------------------------------------
export const { resetProfile } = profileSlice.actions;

export const selectEmployeeProfile = (state: RootState) =>
  state.profile?.employee ?? null;

export const selectProfileStatus = (state: RootState) =>
  state.profile?.status ?? "idle";

export const selectProfileError = (state: RootState) =>
  state.profile?.error ?? null;

export const selectEmploymentHistory = (state: RootState) =>
  state.profile?.history ?? [];

export const selectEmploymentHistoryStatus = (state: RootState) =>
  state.profile?.historyStatus ?? "idle";

export const selectEmploymentHistoryError = (state: RootState) =>
  state.profile?.historyError ?? null;

export const selectHolidayRequests = (state: RootState) =>
  state.profile?.holidayRequests ?? [];

export const selectAbsences = (state: RootState) =>
  state.profile?.absences ?? [];

export default profileSlice.reducer;
