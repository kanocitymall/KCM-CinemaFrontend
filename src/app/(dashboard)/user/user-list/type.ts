// ✅ Changed 'any' to 'unknown' to satisfy strict linting rules
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

// For Laravel-style pagination
export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginatedData<T> {
  current_page: number;
  data: T[];
  per_page: number;
  total: number;
  links: PaginationLink[];
  last_page?: number;      // Often included in Laravel pagination
  from?: number;           // Optional: helpful for "Showing X to Y"
  to?: number;
}

// ✅ Define User type (from your /users API)
export interface User {
  id: number;
  name: string;
  phoneNo: string;
  address: string;
  email: string;
  status: number;
  state_id: number;
  role: {
    id: number;
    name: string;
    description: string;
  };
  state?: {               // Added state object if your API returns it
    id: number;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
}