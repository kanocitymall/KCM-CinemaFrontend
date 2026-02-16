interface PaymentMethod {
  description: string;
  id: number;
  name: string;
  details: string;
  created_at: string;  
  updated_at: string;  
}


export interface ApiAccount {
  id: number;
  payment_method_id: number;
  name: string;
  number: string;
  description: string;
  status: number;
  acc_balance: string;
  created_at: string;
  updated_at: string;
  payment_method: PaymentMethod;
}

export interface SimpleApiResponse {
  success: boolean;
  data: ApiAccount[];
  message: string;
}


export interface Account {
  id: number;
  name: string;
  account_no: string;
  number: string; 
  details: string;
  description: string; 
  balance: number;
  acc_balance: string; 
  payment_method_id: number;
  status: number;
  created_at: string;
  updated_at: string;
  payment_method: PaymentMethod;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginatedData<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface ApiResponse {
  success: boolean;
  data: PaginatedData<Account>;
  message: string;
}


export interface CreateAccountFormData { 
  id?: number;
  name: string;
  number: string;
  description: string;
  payment_method_id: number;
}


export type VoucherType = {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
};


export type VoucherResponse = {
    success: boolean;
    data: VoucherType[];
    message: string;
};


export interface CreateVoucherTypeFormData {
    id?: number;
    name: string;
    description: string;
    account_id: number;
    month: string;
    year: string;
    date: string;
    voucher_type_id: number;
    amount: number;
}



 interface PaymentMethod {
  id: number;
  name: string;
  details: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: number;
  name: string;
  account_no: string;
  details: string;
  balance: number;
  payment_method_id: number;
  status: number;
  created_at: string;
  updated_at: string;
  payment_method: PaymentMethod;
}

 interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginatedData<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface AccountsApiResponse {
  success: boolean;
  data: PaginatedData<Account>;
  message: string;
}


export function transformApiAccountToAccount(apiAccount: ApiAccount): Account {
  return {
    ...apiAccount,
    account_no: apiAccount.number,
    details: apiAccount.description,
    balance: parseFloat(apiAccount.acc_balance),
    payment_method: {
      ...apiAccount.payment_method,
      details: apiAccount.payment_method.description,
    }
  };
}
