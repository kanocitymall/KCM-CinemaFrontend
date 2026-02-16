"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Spinner, Form, Button, Card } from "react-bootstrap";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";

interface BaseApiResponse<T> {
  data?: T | { data: T };
}
// --- Interfaces ---
interface PaymentMethod {
  id: number;
  name: string;
}

interface Account {
  id: number;
  name: string;
  payment_method_id: number;
  number: string | null;
  acc_balance: string;
  description: string;
}

interface BookingDetails {
  id: number;
  hall_name: string;
  outstanding_balance: number;
  status: string;
}

interface PaymentPayload {
  booking_id: number;
  amount: number;
  reason: string;
  paymethod_id: number;
  account_id: number;
  transaction_date: string;
}

interface PaymentFormData {
  booking_id: number;
  amount: number;
  reason: string;
  transaction_date: string;
}

// Added to resolve 'any' errors in API mapping
interface RawBookingResponse {
  id: number;
  balance?: string | number;
  status?: string;
  hall?: {
    name: string;
  };
}

interface RefundResponse {
  transaction_id?: string;
  transactionId?: string;
  id?: string;
}

interface Props {
  bookingId: number;
  defaultAmount?: number;
  onSuccess?: (txId: string) => void;
  onClose?: () => void;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

const api = getApiClientInstance();

async function safeApiCall<T>(call: Promise<BaseApiResponse<T>>): Promise<T> {
  try {
    const response = await call;

    // Handle the common "response.data" or "response" wrap
    const firstLayer = response?.data ?? response;

    // Type Guard to check if it's nested: { data: { data: T } }
    if (
      firstLayer && 
      typeof firstLayer === "object" && 
      "data" in firstLayer && 
      firstLayer.data !== undefined
    ) {
      return (firstLayer as { data: T }).data;
    }

    return firstLayer as T;
  } catch (error: unknown) {
    const err = error as ApiError;
    throw new Error(err?.response?.data?.message || err?.message || "API call failed");
  }
}

const fetchPaymentMethods = () =>
  safeApiCall<PaymentMethod[]>(api.get(`/accounting/get-all-payment-methods`));

const fetchAccounts = () =>
  safeApiCall<Account[]>(api.get(`/accounting/accounts`));

const confirmRefundPayment = (payload: PaymentPayload) =>
  safeApiCall<RefundResponse>(api.post(`/bookings/booking-refund`, payload));

const fetchBookingDetails = (bookingId: number) =>
  safeApiCall<RawBookingResponse>(api.get(`/bookings/show-booking/${bookingId}`));

export default function BookingRefundForm({
  bookingId,
  defaultAmount = 0,
  onSuccess,
  onClose,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<PaymentFormData>({
    booking_id: bookingId,
    amount: defaultAmount,
    reason: "",
    transaction_date: new Date().toISOString().split("T")[0], 
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [selectedPaymethodId, setSelectedPaymethodId] = useState<number>(0);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(0);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  const handlePaymentDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericValue = Number(value) || 0;
    if (name === "paymethod_id") {
      setSelectedPaymethodId(numericValue);
      setSelectedAccountId(0); 
    } else if (name === "account_id") {
      setSelectedAccountId(numericValue);
    }
  };

  const filteredAccounts = useMemo(() => {
    if (selectedPaymethodId === 0) return [];
    return allAccounts.filter(
      (acc: Account) => Number(acc.payment_method_id) === Number(selectedPaymethodId)
    );
  }, [allAccounts, selectedPaymethodId]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [methodsResp, accountsResp] = await Promise.all([
          fetchPaymentMethods(),
          fetchAccounts(),
        ]);
        setPaymentMethods(methodsResp || []);
        setAllAccounts(accountsResp || []);
      } catch (err: unknown) {
        const error = err as Error;
        toast.error(`Failed to load payment data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const loadBookingDetails = async () => {
      if (!form.booking_id) return;
      setIsBalanceLoading(true);
      try {
        const data = await fetchBookingDetails(form.booking_id);
        const details: BookingDetails = {
          id: data.id,
          hall_name: data.hall?.name ?? "N/A",
          outstanding_balance: Number(data.balance ?? 0),
          status: data.status ?? "N/A",
        };
        setBookingDetails(details);
        setForm((prev) => ({
          ...prev,
          amount: prev.amount > 0 ? prev.amount : details.outstanding_balance,
        }));
      } catch (err: unknown) {
        const error = err as Error;
        toast.error(`Failed to load booking details: ${error.message}`);
      } finally {
        setIsBalanceLoading(false);
      }
    };
    loadBookingDetails();
  }, [form.booking_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!form.booking_id || form.booking_id <= 0) {
      toast.error("Missing booking ID.");
      setIsSubmitting(false);
      return;
    }

    if (
      selectedPaymethodId === 0 ||
      selectedAccountId === 0 ||
      form.amount <= 0 ||
      form.reason.trim() === ""
    ) {
      toast.error("Please complete all required fields.");
      setIsSubmitting(false);
      return;
    }

    const payload: PaymentPayload = {
      booking_id: form.booking_id,
      amount: form.amount,
      reason: form.reason,
      paymethod_id: selectedPaymethodId,
      account_id: selectedAccountId,
      transaction_date: form.transaction_date,
    };

    try {
      const response = await confirmRefundPayment(payload);
      const transactionId = response.transaction_id || response.transactionId || response.id || "N/A";
      toast.success(`🎉 Refund processed! Transaction ID: ${transactionId}`);
      onSuccess?.(transactionId);
      onClose?.();
      if (!onSuccess && !onClose) router.push("/booking/booking-list");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Refund failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center">
      <div style={{ maxWidth: 550, width: "100%" }}>
        <Card className="shadow-lg border-0 rounded-5 p-4 bg-white">
          <Card.Body>
            <h3 className="card-title text-center text-primary fw-bolder mb-4">
              <i className="bi bi-arrow-repeat me-2" /> Booking Refund
            </h3>
            <hr className="mb-4" />

            {isBalanceLoading && (
              <div className="text-center p-3 mb-3">
                <Spinner size="sm" animation="border" variant="info" className="me-2" />
                <span className="text-muted">Loading booking details...</span>
              </div>
            )}
            
            {bookingDetails && !isBalanceLoading && (
              <div className="mb-4 p-3 bg-info-subtle rounded-4 border-start border-5 border-info">
                <p className="mb-1 text-dark fw-bold">
                  <i className="bi bi-hash me-2" /> Booking Reference: <span className="fw-normal">{bookingDetails.id}</span>
                </p>
                <p className="mb-1 text-dark fw-bold">
                  <i className="bi bi-building me-2" /> Hall Name: <span className="fw-normal">{bookingDetails.hall_name}</span>
                </p>
                <p className="mb-0 text-dark fw-bold">
                  <i className="bi bi-info-circle me-2" /> Current Status: <span className={`badge bg-secondary`}>{bookingDetails.status}</span>
                </p>
              </div>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Payment Method *</Form.Label>
                <Form.Select
                  name="paymethod_id"
                  value={String(selectedPaymethodId)}
                  onChange={handlePaymentDropdownChange}
                  required
                  className="form-control-lg rounded-3"
                >
                  <option value={0}>-- Select Method for Refund --</option>
                  {paymentMethods.map((method: PaymentMethod) => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Source Account *</Form.Label>
                <Form.Select
                  name="account_id"
                  value={String(selectedAccountId)}
                  onChange={handlePaymentDropdownChange}
                  required
                  disabled={selectedPaymethodId === 0 || loading}
                  className="form-control-lg rounded-3"
                >
                  <option value={0}> Select Account to Refund From </option>
                  {filteredAccounts.map((account: Account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} {account.number ? `(${account.number})` : ""}
                    </option>
                  ))}
                </Form.Select>

                {selectedAccountId !== 0 && (
                  <div className="mt-2 p-2 bg-info-subtle border-start border-info border-4 rounded-2 small">
                    {filteredAccounts
                      .filter((acc: Account) => acc.id === selectedAccountId)
                      .map((acc: Account) => (
                        <div key={acc.id} className="text-dark">
                          <div>Account Balance: ₦{Number(acc.acc_balance).toLocaleString()}</div>
                          <div>Description: {acc.description || "No description"}</div>
                        </div>
                      ))}
                  </div>
                )}
              </Form.Group>

              <hr className="my-4" />

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Refund Amount *</Form.Label>
                <Form.Control
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  required
                  className="form-control-lg text-danger fw-bolder rounded-3"
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Refund Date *</Form.Label>
                <Form.Control
                  type="date"
                  name="transaction_date"
                  value={form.transaction_date}
                  onChange={handleChange}
                  required
                  className="form-control-lg rounded-3"
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Reason for Refund *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  required
                  className="form-control-lg rounded-3"
                />
              </Form.Group>

              <div className="d-grid gap-3 mt-4">
                <Button
                  type="submit"
                  variant="warning"
                  size="lg"
                  disabled={isSubmitting || loading}
                  className="btn d-flex align-items-center justify-content-center gap-2 rounded-3 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner animation="border" size="sm" />
                      Processing Refund...
                    </>
                  ) : (
                    <><i className="bi bi-check2-circle" /> Confirm & Submit Refund</>
                  )}
                </Button>
                {onClose && (
                  <Button
                    variant="light"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="text-muted rounded-3"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}