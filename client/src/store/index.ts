import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import holidaysReducer from "@/features/holidays/holidaySlice";
import attendanceReducer from "@/features/attendance/attendanceSlice";
import absencesReducer from "@/features/absences/absenceSlice";
import teamReducer from "@/features/team/teamSlice";
import profileReducer from "@/features/profile/profileSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    holidays: holidaysReducer,
    attendance: attendanceReducer,
    absences: absencesReducer,
    team: teamReducer,
    profile: profileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
