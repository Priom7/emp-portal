import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Endpoints } from "@/lib/endpoints";
import type { RootState } from "@/store";
import { logout } from "@/features/auth/authSlice";
import { validateHolidayRequest } from "@/lib/holidayValidation";

type RequestState = "idle" | "loading" | "succeeded" | "failed";

interface HolidayState {
  stats: any | null;
  entitlement: any | null;
  entitlementStatus: RequestState;
  entitlementError: string | null;
  history: any[];
  historyStatus: RequestState;
  historyError: string | null;
  status: RequestState;
  error: string | null;
  validationStatus: RequestState;
  validationError: string | null;
  submissionStatus: RequestState;
  submissionError: string | null;
}

const initialState: HolidayState = {
  stats: null,
  entitlement: null,
  entitlementStatus: "idle",
  entitlementError: null,
  history: [],
  historyStatus: "idle",
  historyError: null,
  status: "idle",
  error: null,
  validationStatus: "idle",
  validationError: null,
  submissionStatus: "idle",
  submissionError: null,
};

export const fetchHolidayEntitlement = createAsyncThunk<
  any | null,
  { holiday_year: number; employee_id?: number },
  { rejectValue: string }
>("holidays/fetchHolidayEntitlement", async (params, { rejectWithValue }) => {
  try {
    const res = await Endpoints.holidayEntitlement(params);
    if (res.data?.success !== 1) {
      return rejectWithValue(res.data?.msg || res.data?.error || "Failed to load entitlement");
    }
    return res.data.entitlement ?? null;
  } catch (err) {
    return rejectWithValue("Failed to load entitlement");
  }
});

export const fetchHolidayHistory = createAsyncThunk<
  any[],
  { holiday_year?: number },
  { rejectValue: string }
>("holidays/fetchHolidayHistory", async (params, { rejectWithValue }) => {
  try {
    const res = await Endpoints.holidayHistory(params);
    if (res.data?.success !== 1) {
      return rejectWithValue(res.data?.msg || res.data?.error || "Failed to load history");
    }
    return res.data?.history || res.data?.requests || [];
  } catch (err) {
    return rejectWithValue("Failed to load history");
  }
});

export const fetchHolidayStats = createAsyncThunk<
  any | null,
  void,
  { rejectValue: string }
>("holidays/fetchHolidayStats", async (_, { rejectWithValue }) => {
  try {
    const res = await Endpoints.myHolidays();
    return res.data?.stats ?? null;
  } catch (err) {
    return rejectWithValue("Failed to load holiday stats");
  }
});

export const validateHoliday = createAsyncThunk<
  any,
  { start_date: string; end_date: string; holiday_year: number },
  { rejectValue: string }
>("holidays/validateHoliday", async (payload, { rejectWithValue }) => {
  const validation = validateHolidayRequest(payload.start_date, payload.end_date, payload.holiday_year);
  if (!validation.success) {
    return rejectWithValue(validation.error);
  }
  try {
    const res = await Endpoints.validateHoliday(payload);
    if (res.data?.success !== 1) {
      return rejectWithValue(res.data?.error || "Holiday dates not valid");
    }
    return res.data;
  } catch (err) {
    return rejectWithValue("Unable to validate holiday");
  }
});

export const submitHoliday = createAsyncThunk<
  any,
  Record<string, any>,
  { rejectValue: string }
>("holidays/submitHoliday", async (payload, { rejectWithValue }) => {
  try {
    const res = await Endpoints.submitHoliday(payload);
    if (res.data?.success !== 1) {
      return rejectWithValue(res.data?.error || "Unable to submit holiday");
    }
    return res.data;
  } catch (err) {
    return rejectWithValue("Unable to submit holiday");
  }
});

const holidaySlice = createSlice({
  name: "holidays",
  initialState,
  reducers: {
    resetHolidays(state) {
      state.stats = null;
      state.entitlement = null;
      state.entitlementStatus = "idle";
      state.entitlementError = null;
      state.history = [];
      state.historyStatus = "idle";
      state.historyError = null;
      state.status = "idle";
      state.error = null;
      state.validationStatus = "idle";
      state.validationError = null;
      state.submissionStatus = "idle";
      state.submissionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHolidayEntitlement.pending, (state) => {
        state.entitlementStatus = "loading";
        state.entitlementError = null;
      })
      .addCase(fetchHolidayEntitlement.fulfilled, (state, action) => {
        state.entitlementStatus = "succeeded";
        state.entitlement = action.payload;
      })
      .addCase(fetchHolidayEntitlement.rejected, (state, action) => {
        state.entitlementStatus = "failed";
        state.entitlementError = action.payload || "Failed to load entitlement";
        state.entitlement = null;
      })
      .addCase(fetchHolidayHistory.pending, (state) => {
        state.historyStatus = "loading";
        state.historyError = null;
      })
      .addCase(fetchHolidayHistory.fulfilled, (state, action) => {
        state.historyStatus = "succeeded";
        state.history = action.payload;
      })
      .addCase(fetchHolidayHistory.rejected, (state, action) => {
        state.historyStatus = "failed";
        state.historyError = action.payload || "Failed to load history";
        state.history = [];
      })
      .addCase(fetchHolidayStats.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchHolidayStats.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.stats = action.payload;
      })
      .addCase(fetchHolidayStats.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to load holiday stats";
      })
      .addCase(validateHoliday.pending, (state) => {
        state.validationStatus = "loading";
        state.validationError = null;
      })
      .addCase(validateHoliday.fulfilled, (state) => {
        state.validationStatus = "succeeded";
      })
      .addCase(validateHoliday.rejected, (state, action) => {
        state.validationStatus = "failed";
        state.validationError = action.payload || "Holiday validation failed";
      })
      .addCase(submitHoliday.pending, (state) => {
        state.submissionStatus = "loading";
        state.submissionError = null;
      })
      .addCase(submitHoliday.fulfilled, (state) => {
        state.submissionStatus = "succeeded";
      })
      .addCase(submitHoliday.rejected, (state, action) => {
        state.submissionStatus = "failed";
        state.submissionError = action.payload || "Holiday submission failed";
      })
      .addCase(logout, (state) => {
        state.stats = null;
        state.entitlement = null;
        state.history = [];
        state.entitlementStatus = "idle";
        state.entitlementError = null;
        state.historyStatus = "idle";
        state.historyError = null;
        state.status = "idle";
        state.error = null;
        state.validationStatus = "idle";
        state.validationError = null;
        state.submissionStatus = "idle";
        state.submissionError = null;
      });
  },
});

export const { resetHolidays } = holidaySlice.actions;
export const selectHolidayStats = (state: RootState) => state.holidays.stats;
export const selectHolidayEntitlement = (state: RootState) => state.holidays.entitlement;
export const selectHolidayEntitlementStatus = (state: RootState) => state.holidays.entitlementStatus;
export const selectHolidayEntitlementError = (state: RootState) => state.holidays.entitlementError;
export const selectHolidayHistory = (state: RootState) => state.holidays.history;
export const selectHolidayHistoryStatus = (state: RootState) => state.holidays.historyStatus;
export const selectHolidayHistoryError = (state: RootState) => state.holidays.historyError;
export const selectHolidayStatus = (state: RootState) => state.holidays.status;
export const selectHolidayError = (state: RootState) => state.holidays.error;
export const selectHolidayValidationStatus = (state: RootState) =>
  state.holidays.validationStatus;
export const selectHolidayValidationError = (state: RootState) =>
  state.holidays.validationError;
export const selectHolidaySubmissionStatus = (state: RootState) =>
  state.holidays.submissionStatus;
export const selectHolidaySubmissionError = (state: RootState) =>
  state.holidays.submissionError;

export default holidaySlice.reducer;
