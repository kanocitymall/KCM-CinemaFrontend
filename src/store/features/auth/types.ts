export interface Permission {
  id: number;
  name: string;
  module_id: number;
  pivot: {
    user_id: number;
    permission_id: number;
  };
}

export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface UserType {
  id: number;
  name: string;
  phoneNo: string;
  address: string;
  email: string;
  email_verified_at: string | null;
  role_id: number;
  state_id: number;
  status: number;
  created_at: string;
  updated_at: string;
  role: Role;
  permissions: Permission[];
  code?: string;
  client_code?: string;
  agent_code?: string;
  
  /**
   * ✅ MERGED CLIENT OBJECT
   * This handles both generic client data and client-user specific data
   */
  client?: {
    id: number;
    name: string;
    phoneno?: string;
    code?: string;
    email?: string;
    address?: string | null;
    state_id?: number | null;
    user_id?: number;
    status?: number;
    created_at?: string;
    updated_at?: string;
  };

  /**
   * Optional nested agent object for agent users
   */
  agent?: {
    id: number;
    name: string;
    phoneno?: string;
    code?: string;
    email?: string;
    address?: string | null;
    state_id?: number | null;
    user_id?: number;
    status?: number;
    created_at?: string;
    updated_at?: string;
  };
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: UserType;
    token: string;
  };
  message: string;
}

export interface AuthType {
  isAuthenticated: boolean;
  user: UserType | null;
  loading: boolean;
  error: string | null;
  token: string | null;
  hasDefaultPassword?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}