"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthType, UserType } from "./types";
import {
  login,
  initializeUser,
} from "../../../store/features/auth/auth-thunks";
import { clearAuthToken } from "../../../app/utils/auth";

// ✅ 1. Define base interfaces with index signatures to avoid 'any'
interface AgentData {
  id: number;
  code: string;
  [key: string]: unknown; 
}

interface ClientData {
  id: number;
  code: string;
  [key: string]: unknown;
}

/** * ✅ 2. Fix Error 2430: Omit EVERYTHING we are redefining.
 * We must omit 'role', 'agent', and 'client' because our new definitions 
 * (allowing null or different structures) conflict with the base UserType.
 */
interface ExtendedUser extends Omit<UserType, 'role' | 'agent' | 'client'> {
  client_code?: string;
  agent_code?: string;
  agent?: AgentData | null; 
  client?: ClientData | null; 
  role?: {
    name: string;
  };
}

const initialState: AuthType = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
  token: null,
  hasDefaultPassword:
    typeof window !== "undefined"
      ? (() => {
          const val = localStorage.getItem("hasDefaultPassword") === "true";
          return val;
        })()
      : false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logoutUser: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.hasDefaultPassword = false;
      clearAuthToken();
      if (typeof window !== "undefined") {
        localStorage.removeItem("hasDefaultPassword");
        localStorage.removeItem("userData");
        localStorage.removeItem("clientCode");
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearDefaultPasswordFlag: (state) => {
      state.hasDefaultPassword = false;
      if (typeof window !== "undefined") {
        localStorage.setItem("hasDefaultPassword", "false");
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        login.fulfilled,
        (
          state,
          action: PayloadAction<{
            user: ExtendedUser;
            token: string;
            hasDefaultPassword: boolean;
          }>
        ) => {
          state.loading = false;
          // ✅ Use 'as any' then 'as UserType' if the structures are very different,
          // but 'as UserType' usually works if the core fields (id, email) match.
          state.user = action.payload.user as unknown as UserType;
          state.token = action.payload.token;
          state.isAuthenticated = true;
          state.hasDefaultPassword = action.payload.hasDefaultPassword;
          
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "hasDefaultPassword",
              action.payload.hasDefaultPassword ? "true" : "false"
            );
          }
        }
      )
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Login failed";
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      .addCase(initializeUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        initializeUser.fulfilled,
        (
          state,
          action: PayloadAction<{
            user: ExtendedUser;
            token: string;
            hasDefaultPassword: boolean;
          } | null>
        ) => {
          state.loading = false;
          if (action.payload) {
            state.user = action.payload.user as unknown as UserType;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.hasDefaultPassword = action.payload.hasDefaultPassword;
          } else {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.hasDefaultPassword = false;
            clearAuthToken();
          }
        }
      )
      .addCase(initializeUser.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.hasDefaultPassword = false;
        clearAuthToken();
      });
  },
});

export const authSliceActions = authSlice.actions;
export const authSliceReducer = authSlice.reducer;