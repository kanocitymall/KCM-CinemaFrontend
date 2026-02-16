export interface Hall {
  id?:number;
  name: string;
  capacity: number;
  details: string;
  price: number;
  agent_commission: number;
  checkin_price: number;
  isActive: boolean; // ✅ added this
}

export interface PaginatedData<T> {
  data: T[];
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface ApiResponse {
  data: PaginatedData<Hall>;
  message: string;
  status: string;
}
