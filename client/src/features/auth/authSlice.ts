import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Endpoints } from "@/lib/endpoints";
import type { RootState } from "@/store";

type AuthStatus = "idle" | "loading" | "succeeded" | "failed";

interface AuthState {
  user: any | null;
  status: AuthStatus;
  error: string | null;
}

const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem("employee_user");
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    localStorage.removeItem("employee_user");
    return null;
  }
};

const persistUser = (user: any | null) => {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem("employee_user");
    return;
  }
  localStorage.setItem("employee_user", JSON.stringify(user));
};

const initialState: AuthState = {
  user: getStoredUser(),
  status: "idle",
  error: null,
};

export const hydrateSession = createAsyncThunk("auth/hydrateSession", async () => {
  return getStoredUser();
});

export const loginEmployee = createAsyncThunk<
  any,
  { empId: number; password: string },
  { rejectValue: string }
>("auth/loginEmployee", async ({ empId, password }, { rejectWithValue }) => {
  try {
    const res = await Endpoints.employeeLogin(empId, password);
    if (res.data?.success !== 1) {
      return rejectWithValue("Invalid employee ID or password");
    }
    return res.data;
  } catch (err) {
    return rejectWithValue("Server or network error");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.status = "idle";
      state.error = null;
      persistUser(null);
    },
    setUser(state, action: PayloadAction<any | null>) {
      state.user = action.payload;
      persistUser(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateSession.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(loginEmployee.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginEmployee.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        persistUser(action.payload);
      })
      .addCase(loginEmployee.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Unable to login";
      });
  },
});

export const { logout, setUser } = authSlice.actions;
export const selectUser = (state: RootState) => state.auth.user;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;

export default authSlice.reducer;
