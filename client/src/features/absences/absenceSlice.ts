import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Endpoints } from "@/lib/endpoints";
import type { RootState } from "@/store";

type RequestState = "idle" | "loading" | "succeeded" | "failed";

interface AbsenceState {
  status: RequestState;
  error: string | null;
  lastResult: any | null;
}

const initialState: AbsenceState = {
  status: "idle",
  error: null,
  lastResult: null,
};

export const submitAbsence = createAsyncThunk<any, Record<string, any>, { rejectValue: string }>(
  "absences/submitAbsence",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await Endpoints.submitAbsence(payload);
      if (res.data?.success !== 1) {
        return rejectWithValue(res.data?.error || "Unable to submit absence");
      }
      return res.data;
    } catch (err) {
      return rejectWithValue("Unable to submit absence");
    }
  },
);

const absenceSlice = createSlice({
  name: "absences",
  initialState,
  reducers: {
    resetAbsence(state) {
      state.status = "idle";
      state.error = null;
      state.lastResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitAbsence.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(submitAbsence.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.lastResult = action.payload;
      })
      .addCase(submitAbsence.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Unable to submit absence";
      });
  },
});

export const { resetAbsence } = absenceSlice.actions;
export const selectAbsenceStatus = (state: RootState) => state.absences.status;
export const selectAbsenceError = (state: RootState) => state.absences.error;

export default absenceSlice.reducer;
