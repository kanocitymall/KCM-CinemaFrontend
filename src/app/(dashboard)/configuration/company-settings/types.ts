export interface Company {
  id: number;
  name: string;
  motto: string;
  farewell_message: string;
  contact_number: string;
  contact_email: string;
  address: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_sort_code: string;
  support_hours: string;
  support_phone: string;
  facebook_url: string;
  instagram_url: string;
  other_url: string;
  vat_rate: number;
}

export interface SimpleApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}