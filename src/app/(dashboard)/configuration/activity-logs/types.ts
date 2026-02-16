export interface User {
  id: number;
  name: string;
  phoneNo: string;
  address: string | null;
  email: string;
  email_verified_at: string | null;
  role_id: number;
  state_id: number | null;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  activity: string;
  more_details: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  user: User;
}

export interface PaginatedData<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface SimpleApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}