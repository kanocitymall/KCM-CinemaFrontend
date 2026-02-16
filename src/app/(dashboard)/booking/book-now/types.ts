// types.ts (Pure TypeScript)

export interface CheckAvailabilityData {
  hall_id: number | string;
  date: string;
  starttime: string;
  endtime: string;
}

interface BookingService {
  service_id: number;
  quantity: number;
  [key: string]: number | string | unknown; // replaced 'any'
}

export interface BookingFormData {
  hall_id: number;
  date: string;
  starttime: string;
  endtime: string;
  participants_checkin: boolean;
  participants_no: number;
  agent_code: string;
  booking_services: BookingService[];
}

export interface BookingFormProps {
  bookingData?: BookingFormData;
  onSubmit: (formData: BookingFormData) => Promise<void>;
  saving?: boolean;
}