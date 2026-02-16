import { createAsyncThunk } from "@reduxjs/toolkit";
import { LoginCredentials, UserType, LoginResponse } from "./types";
import { setAuthToken, getAuthToken } from "../../../app/utils/auth";
import { getApiClientInstance } from "../../../app/utils/axios/axios-client";

// ✅ Helper interface for API Error handling
interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message: string;
}

// ✅ Specific interfaces with index signatures to satisfy ESLint
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

/** * ✅ Fix: Omit ALL conflicting properties from UserType.
 * Redefining 'agent' or 'client' as nullable requires omitting them first 
 * if the base UserType defines them as non-nullable objects.
 */
interface ExtendedUser extends Omit<UserType, 'role' | 'agent' | 'client'> {
  client_code?: string;
  agent_code?: string;
  agent?: AgentData | null; 
  client?: ClientData | null; 
  code?: string;
  role?: {
    name: string;
  };
}

export const login = createAsyncThunk<
  { user: ExtendedUser; token: string; hasDefaultPassword: boolean },
  LoginCredentials,
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const api = getApiClientInstance();
    const response = await api.post<LoginResponse>("/users/login", credentials);

    console.log("Login response:", response.data);

    // ✅ Check if the backend response indicates success
    if (!response.data.success) {
      const errorMsg = response.data.message || "Login failed";
      console.log("Backend rejected login with message:", errorMsg);
      return rejectWithValue(errorMsg);
    }

    // Cast response to ExtendedUser
    const user = response.data.data.user as unknown as ExtendedUser;
    const { token } = response.data.data;
    setAuthToken(token);

    // Normalize client code
    const clientCodeFromClient = user.client?.code;
    const clientCodeFromUser = user.code || user.client_code;
    const clientCode = clientCodeFromClient || clientCodeFromUser || null;

    if (clientCode) {
      user.client_code = (clientCode as string);
    }

    const roleName = user.role?.name?.toLowerCase() || "";

    // For agent users
    if (roleName.includes("agent")) {
      try {
        const agentResponse = await api.get(`/agents/user/${user.id}`);
        if (agentResponse.data.success && agentResponse.data.data) {
          const agentData = agentResponse.data.data as AgentData;
          user.agent = agentData;
          user.agent_code = agentData.code;
        }
      } catch {
        const possibleAgentCode = user.code || user.client_code;
        if (possibleAgentCode) {
          user.agent_code = possibleAgentCode;
        }
      }
    }

    // For client users
    if (roleName.includes("client")) {
      try {
        const clientResponse = await api.get(`/clients/user/${user.id}`);
        if (clientResponse.data.success && clientResponse.data.data) {
          user.client = clientResponse.data.data as ClientData;
        }
      } catch {
        // Error handled silently
      }
    }

    if (typeof window !== "undefined" && clientCode) {
      try {
        localStorage.setItem("clientCode", (clientCode as string));
      } catch {
        // ignore
      }
    }

    const isDefaultPassword = credentials.password === "123456789";

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("userData", JSON.stringify(user));
      } catch {
        // ignore
      }
    }

    return { user, token, hasDefaultPassword: isDefaultPassword };
  } catch (err: unknown) {
    const error = err as ApiError;
    // ✅ Priority: Extract message from response.data.message (backend error), then fall back to error.message
    const errorMessage = error.response?.data?.message || error.message || "Login failed";
    console.log("Login error:", errorMessage);
    return rejectWithValue(errorMessage);
  }
});

export const initializeUser = createAsyncThunk<
  { user: ExtendedUser; token: string; hasDefaultPassword: boolean } | null,
  void,
  { rejectValue: string }
>("auth/initializeUser", async () => {
  try {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const api = getApiClientInstance();
      const response = await api.get<LoginResponse>("/users/me");

      if (response.data && response.data.data) {
        const user = response.data.data.user as unknown as ExtendedUser;

        const clientCodeFromClient = user.client?.code;
        const clientCodeFromUser = user.code || user.client_code;
        const clientCode = clientCodeFromClient || clientCodeFromUser || null;

        if (clientCode) {
          user.client_code = (clientCode as string);
        }

        const hasDefaultPassword =
          typeof window !== "undefined"
            ? localStorage.getItem("hasDefaultPassword") === "true"
            : false;

        if (typeof window !== "undefined") {
          localStorage.setItem("userData", JSON.stringify(user));
        }

        return { user, token, hasDefaultPassword };
      }
    } catch (apiErr: unknown) {
      const error = apiErr as ApiError;
      
      if (error.response?.status === 401) return null;

      const hasDefaultPassword =
        typeof window !== "undefined"
          ? localStorage.getItem("hasDefaultPassword") === "true"
          : false;

      let storedUser: ExtendedUser | null = null;
      if (typeof window !== "undefined") {
        try {
          const userDataStr = localStorage.getItem("userData");
          if (userDataStr) {
            storedUser = JSON.parse(userDataStr) as ExtendedUser;
          }
        } catch {
          // ignore
        }
      }

      if (storedUser) {
        return { user: storedUser, token, hasDefaultPassword };
      }
      return null;
    }

    return null;
  } catch {
    return null;
  }
});