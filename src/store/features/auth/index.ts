import { combineReducers } from "@reduxjs/toolkit";
import { authSliceActions, authSliceReducer } from "./auth-slice";
import * as authThunks from "../../../store/features/auth/auth-thunks";

export const authReducer = combineReducers({
  main: authSliceReducer,
});

export const authActions = {
  main: { ...authSliceActions, ...authThunks },
};
