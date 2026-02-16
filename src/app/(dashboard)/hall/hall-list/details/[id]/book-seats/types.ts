export interface Seat {
  id: number;
  hall_id: number;
  seat_row: string;
  seat_number: number;
  label: string;
  seat_type: string;
  status: number; // 1 for Available, 0 for Occupied
  created_at: string;
  updated_at: string;
}

export interface SeatApiResponse {
  success: boolean;
  data: {
    data: Seat[];
    total: number;
    current_page: number;
    // ... other pagination fields if needed
  };
  message: string;
}