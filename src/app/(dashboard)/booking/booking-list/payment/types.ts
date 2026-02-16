// src/app/(dashboard)/booking/booking-list/types.ts

export interface AccountFormValues {
  accountName: string;
  accountNumber: string;
  bankName: string;
  paymentMethod?: string;
  amountPaid?: number;
  bookingId?: string | number;
  status?: "pending" | "paid" | "failed";
  date?: string;
}

export interface CreateAccountFormData {
  accountName: string;
  accountNumber: string;
  bankName: string;
  amountPaid: number;
  paymentMethod: string;
  bookingId: string;
}
