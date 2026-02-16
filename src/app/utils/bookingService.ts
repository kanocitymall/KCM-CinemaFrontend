import { getApiClientInstance } from './axios/axios-client';
import { AxiosError } from 'axios';

export interface SeatInfo {
  id: number;
  label: string;
  seat_row: string;
  seat_number: number;
  seat_type: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface BookingSeat {
  id: number;
  booking_id: number;
  seat_id: number;
  price: string;
  qr_code: string;
  checkin_status: 'checked_in' | 'not_checked_in';
  status: string;
  created_at: string;
  updated_at: string;
  seat: SeatInfo;
}

export interface Customer {
  id: number;
  name: string;
  phoneno: string;
  code: string;
  email: string;
  address: string;
  user_id: number;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface BookingData {
  id: number;
  schedule_id: number;
  code: string;
  number_of_seats: number;
  dueamount: string;
  booking_time: string;
  customer_id: number | null;
  walkin_customer_name: string | null;
  walkin_customer_no: string | null;
  walkin_customer_email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  booking_seats: BookingSeat[];
  customer: Customer | null;
}

export interface ScheduleInfo {
  id: number;
  program_id: number;
  hall_id: number;
  details: string;
  date: string;
  starttime: string;
  endtime: string;
  regular_price: string;
  vip_price: string;
  user_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleBookingsResponse {
  success: boolean;
  data: {
    schedule: ScheduleInfo;
    bookings: {
      current_page: number;
      data: BookingData[];
      last_page: number;
      total: number;
    };
  };
  message?: string;
}

export interface BookingDetailsResponse {
  success: boolean;
  data: {
    booking: BookingData;
    schedule?: ScheduleInfo;
  };
  message?: string;
}

/**
 * Fetch all bookings for a specific schedule
 * Used to get all QR codes and booking details for a schedule
 */
export const fetchScheduleBookings = async (
  scheduleId: number,
  page: number = 1
): Promise<ScheduleBookingsResponse> => {
  try {
    const api = getApiClientInstance();
    const response = await api.get<ScheduleBookingsResponse>(
      `/bookings/schedule-bookings/${scheduleId}?page=${page}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching schedule bookings:', error);
    throw error;
  }
};

/**
 * Fetch details for a single booking
 */
export const fetchBookingDetails = async (bookingId: number): Promise<BookingDetailsResponse> => {
  try {
    const api = getApiClientInstance();
    const response = await api.get<BookingDetailsResponse>(
      `/bookings/show-booking/${bookingId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching booking details:', error);
    throw error;
  }
};

/**
 * Download QR code PDF for a specific booking seat
 * The QR code data comes from the booking_seats array
 */
export const getQRCodeForSeat = async (
  bookingId: number,
  seatId: number
): Promise<string | null> => {
  try {
    const response = await fetchBookingDetails(bookingId);
    if (response.success && response.data.booking.booking_seats) {
      const seat = response.data.booking.booking_seats.find(s => s.seat_id === seatId);
      return seat?.qr_code || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting QR code for seat:', error);
    return null;
  }
};

/**
 * Check in a booking seat using QR code
 */
export const checkInBookingSeat = async (
  qrCode: string
): Promise<{ success: boolean; data?: unknown; message: string }> => {
  try {
    const api = getApiClientInstance();
    const response = await api.post('/checkin/scan-qr', { qr_code: qrCode });
    return response.data;
  } catch (error) {
    console.error('Error checking in seat:', error);
    if (error instanceof AxiosError) {
      return {
        success: false,
        message: error.response?.data?.message || 'Check-in failed',
      };
    }
    return {
      success: false,
      message: 'An error occurred during check-in',
    };
  }
};

/**
 * Generate QR code string for a booking seat
 * This is typically handled by the API, but can be used to verify format
 */
export const generateQRCodeString = (
  bookingCode: string,
  seatLabel: string
): string => {
  return `${bookingCode}-${seatLabel}`;
};
