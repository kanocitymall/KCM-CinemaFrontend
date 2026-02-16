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

export interface User {
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
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
  };
}