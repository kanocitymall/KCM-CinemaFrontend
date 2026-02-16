"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Spinner, Form, Button, Card } from "react-bootstrap";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";

interface PaymentMethod {
  id: number;
  name: string;
}

interface Account {
  id: number;
  name: string;
  paymethod_id: number;
  number: string | null;
  acc_balance: string;
  description: string;
}

interface RawAccountResponse {
  id: string | number;
  name?: string;
  account_name?: string;
  payment_method_id?: string | number;
  paymethod_id?: string | number;
  number?: string;
  acc_balance?: string;
  description?: string;
}

interface BookingService {
  quantity?: number;
  unit_price?: string;
  service?: { price: string };
}

interface BookingApiResponse {
  id: number;
  status?: string;
  hall_name?: string;
  hall?: { name: string; price: string };
  booking_services?: BookingService[];
  checkin_total?: string;
  discount_amount?: string;
  amountpaid?: string;
}

interface Props {
  bookingIdProp: number;
  onSuccess?: (txId: string) => void;
  onClose?: () => void;
}

interface PaymentPayload {
  booking_id: number;
  amount: number;
  paymethod_id: number;
  account_id: number;
  transaction_date: string;
}

interface PaymentFormData {
  booking_id: number;
  amount: number;
  transaction_date: string;
}

interface BookingDetails {
  id: number;
  hall_name: string;
  hall_charge: number;
  total_services_cost: number;
  participants_checkin_charges: number;
  subtotal: number;
  vat_amount: number;
  total_due: number;
  amount_paid: number;
  outstanding_balance: number;
  status: string;
}

const api = getApiClientInstance();

async function safeApiCall<T>(call: Promise<{ data: T | { data: T } }>): Promise<T> {
  try {
    const response = await call;
    const responseData = response.data;

    if (responseData && typeof responseData === "object" && "data" in responseData) {
      return (responseData as { data: T }).data;
    }

    return responseData as T;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    throw new Error(err?.response?.data?.message || err?.message || "API call failed");
  }
}

const confirmPayment = (payload: PaymentPayload) =>
  safeApiCall<{ transaction_id?: string; transactionId?: string; id?: string }>(api.post(`/bookings/confirm-payment`, payload));

const fetchBookingDetails = (bookingId: number) =>
  safeApiCall<BookingApiResponse>(api.get(`/bookings/show-booking/${bookingId}`));

export function ConfirmPaymentForm({ bookingIdProp, onSuccess, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<PaymentFormData>({
    booking_id: bookingIdProp,
    amount: 0.0,
    transaction_date: new Date().toISOString().slice(0, 10),
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [selectedPaymethodId, setSelectedPaymethodId] = useState<number>(0);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(0);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement & { name: string };
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
    return allAccounts.filter((acc) => Number(acc.paymethod_id) === Number(selectedPaymethodId));
  }, [allAccounts, selectedPaymethodId]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const apiClient = getApiClientInstance();

        const methodsRes = await apiClient.get('/accounting/get-all-payment-methods');
        const methodsData = methodsRes.data?.data || (methodsRes.data?.success ? methodsRes.data.data : []);
        if (Array.isArray(methodsData)) setPaymentMethods(methodsData);

        const response = await apiClient.get('/accounting/accounts');
        const accountsResp = response.data?.data || response.data;

        const normalized: Account[] = (accountsResp || []).map((acc: RawAccountResponse) => ({
          id: Number(acc.id),
          name: acc.name ?? acc.account_name ?? `Account ${acc.id}`,
          paymethod_id: Number(acc.payment_method_id ?? acc.paymethod_id ?? 0),
          number: acc.number ?? null,
          acc_balance: acc.acc_balance ?? "0",
          description: acc.description ?? "",
        }));

        setAllAccounts(normalized);
      } catch (err: unknown) {
        toast.error("Failed to load initial setup data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const loadBookingDetails = async () => {
      if (!bookingIdProp) return;
      setIsBalanceLoading(true);
      try {
        const data = await fetchBookingDetails(bookingIdProp);

        const totalServicesCost = (data.booking_services || []).reduce((sum: number, item: BookingService) => {
          const quantity = item.quantity || 1;
          const unitPrice = parseFloat(item.unit_price || item.service?.price || "0");
          return sum + (unitPrice * quantity);
        }, 0);

        const hallPrice = parseFloat(data.hall?.price || "0");
        const checkinAmount = parseFloat(data.checkin_total || "0");
        const discount = parseFloat(data.discount_amount || "0");
        const amountPaid = parseFloat(data.amountpaid || "0");

        const subtotal = hallPrice + totalServicesCost + checkinAmount;
        const totalAfterDiscount = subtotal - discount;
        const vatRate = 0.075;
        const vatAmount = totalAfterDiscount * vatRate;
        const totalDue = totalAfterDiscount + vatAmount;
        const outstandingBalance = totalDue - amountPaid;

        const details: BookingDetails = {
          id: data.id,
          hall_name: data.hall?.name ?? data.hall_name ?? "N/A",
          hall_charge: hallPrice,
          total_services_cost: totalServicesCost,
          participants_checkin_charges: checkinAmount,
          subtotal: totalAfterDiscount,
          vat_amount: vatAmount,
          total_due: totalDue,
          amount_paid: amountPaid,
          outstanding_balance: outstandingBalance,
          status: data.status ?? "N/A",
        };

        setBookingDetails(details);

        setForm((prev) => ({
          ...prev,
          amount: prev.amount === 0 ? outstandingBalance : prev.amount,
        }));
      } catch {
        toast.error("Failed to load booking details.");
      } finally {
        setIsBalanceLoading(false);
      }
    };

    loadBookingDetails();
  }, [bookingIdProp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!form.booking_id || form.booking_id <= 0) {
      toast.error("Missing booking ID.");
      setIsSubmitting(false);
      return;
    }

    const payload: PaymentPayload = {
      booking_id: form.booking_id,
      amount: form.amount,
      paymethod_id: selectedPaymethodId,
      account_id: selectedAccountId,
      transaction_date: form.transaction_date,
    };

    try {
      const response = await confirmPayment(payload);
      const transactionId = response.transaction_id || response.transactionId || response.id || "N/A";
      toast.success(`🎉 Payment confirmed! ID: ${transactionId}`);

      if (onSuccess) onSuccess(transactionId);
      if (onClose) onClose();

      if (!onSuccess && !onClose) {
        router.push("/booking/booking-list");
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Payment confirmation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center">
      <div style={{ maxWidth: 500, width: "100%" }}>
        <Card className="shadow-lg border-0 rounded-5 p-4 bg-white">
          <Card.Body>
            <h3 className="card-title text-center text-primary fw-bolder mb-4">
              <i className="bi bi-credit-card me-2" /> Confirm Payment
            </h3>
            <hr className="mb-4" />

            {isBalanceLoading && (
              <div className="text-center p-3 mb-4">
                <Spinner size="sm" animation="border" variant="primary" className="me-2" />
                <span className="text-muted">Loading booking details...</span>
              </div>
            )}

            {bookingDetails && !isBalanceLoading && (
              <div className="mb-4 p-3 bg-primary-subtle rounded-4 border-start border-5 border-primary">
                <p className="mb-1 text-dark fw-bold">
                  <i className="bi bi-building me-2" /> Booking: <span className="fw-normal">{bookingDetails.hall_name} (#{bookingDetails.id})</span>
                </p>
                <div className="mt-3">
                  <p className="mb-1 text-dark"><strong>Total Due:</strong> ₦{bookingDetails.total_due.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                  <p className="mb-0 text-dark fw-bold fs-5">
                    <i className="bi bi-cash-coin me-2" /> Balance Remaining: ₦{bookingDetails.outstanding_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
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
                >
                  <option value={"0"} disabled>
                    {loading ? "Loading methods..." : "-- Select Method --"}
                  </option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={String(method.id)}>
                      {method.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Receiving Account *</Form.Label>
                <Form.Select
                  name="account_id"
                  value={String(selectedAccountId)}
                  onChange={handlePaymentDropdownChange}
                  required
                  disabled={selectedPaymethodId === 0 || loading}
                >
                  <option value={"0"} disabled>
                    {selectedPaymethodId === 0 ? "Select Method first" : "Select Account"}
                  </option>
                  {filteredAccounts.map((acc) => (
                    <option key={acc.id} value={String(acc.id)}>
                      {acc.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Amount Received *</Form.Label>
                <Form.Control
                  type="number"
                  name="amount"
                  value={form.amount || ""}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Date Received *</Form.Label>
                <Form.Control
                  type="date"
                  name="transaction_date"
                  value={form.transaction_date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <div className="d-grid gap-3 mt-4">
                <Button
                  type="submit"
                  variant="warning"
                  size="lg"
                  disabled={isSubmitting || loading || selectedAccountId === 0 || form.amount <= 0}
                >
                  {isSubmitting ? "Confirming..." : "Record & Confirm Payment"}
                </Button>
                {onClose && (
                  <Button variant="outline-secondary" onClick={onClose} disabled={isSubmitting}>
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