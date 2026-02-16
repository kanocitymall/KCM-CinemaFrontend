// 🔹 Basic API response type
// ✅ Fixed: Replaced 'any' with 'unknown' for the default generic type
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

// 🔹 Pagination link type (matching Laravel pagination)
export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

// 🔹 Paginated data wrapper
export interface PaginatedData<T> {
  current_page: number;
  data: T[];
  from: number;
  last_page: number;
  links: PaginationLink[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

// 🔹 Hall Booking type
export interface HallBooking {
  id: number;
  hall_id?: number;
  hall_name: string;
  date: string;
  starttime: string;
  endtime: string;
  amount: string;
  details?: string;
  status?: number;
  created_at?: string;
  updated_at?: string;
}