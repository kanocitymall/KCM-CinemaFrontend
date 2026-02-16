"use client";

import React, { useState } from "react";
import { getApiClientInstance } from "../../../utils/axios/axios-client";
import showSingleToast from "../../../utils/single-toast";
import { Card, Button, Spinner } from "react-bootstrap";

type BookingPayload = {
  booking_seat_numbers?: string[];
  // Accept either an array of seat objects (from API) or an array of seat IDs (from booking UI)
  booking_seats?: Array<{ seat?: { label?: string } }> | number[];
  walkin_customer_name?: string;
  walkin_customer_email?: string;
  payment_method_id?: number | string | null;
  [key: string]: unknown;
};

type Props = {
  payload: BookingPayload;
  onClose: () => void;
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const maybe = err as { response?: { data?: { message?: string } }; message?: string };
    return maybe.response?.data?.message || maybe.message || String(err);
  }
  return String(err);
}

export default function OnlinePaymentModal({ payload, onClose }: Props) {
  const [loading, setLoading] = useState(false);

  // Using the api.post('/bookings/online-schedule-ticket') endpoint, write an async function to handle online payment.
  // If successful, extract the URL from res.data.data.data and use window.location.href to redirect.
  // If it fails, show a toast error.
  async function handleOnlinePayment() {
    setLoading(true);
    try {
      const api = getApiClientInstance();
      
      // Step 1: Create the booking on the backend and get payment info
      // Include payment_method_id in payload for system record
      const bookingPayload = {
        ...payload,
        payment_method_id: payload?.payment_method_id, // Will be attached to the booking
      };
      
      console.debug("📝 Sending booking with payment_method_id:", bookingPayload);
      
      const res = await api.post("/bookings/online-schedule-ticket", bookingPayload);
      
      // Expected response structure based on the sample data provided:
      // res.data.data.data = { redirect_url, payment_ref, or similar }
      // res.data.data = { booking details with code, qr_code, etc. }
      
      const paymentData = res?.data?.data;
      const redirectUrl = paymentData?.data || paymentData?.redirect_url;
      const bookingCode = paymentData?.code || paymentData?.booking_code;
      const paymentRef = paymentData?.id || paymentData?.payment_ref || paymentData?.transaction_id;
      
      console.debug("✅ Booking response:", {
        bookingCode,
        paymentRef,
        paymentMethodId: payload?.payment_method_id,
        redirectUrl
      });
      
      if (redirectUrl && typeof redirectUrl === "string") {
        // Real Zainpay URL from backend
        console.log("🔒 Redirecting to payment gateway:", redirectUrl);
        window.location.href = redirectUrl;
        return;
      }
      
      // Fallback: if no redirect URL but booking was created, go to demo payment page
      if (bookingCode) {
        showSingleToast("Booking created! Redirecting to payment...");
        const demoUrl = new URL("/zainpay-payment", window.location.origin);
        demoUrl.searchParams.set("email", String(payload?.walkin_customer_email || "customer@example.com"));
        demoUrl.searchParams.set("amount", String(paymentData?.dueamount || "1000"));
        demoUrl.searchParams.set("reference", String(paymentRef || bookingCode));
        demoUrl.searchParams.set("paymentMethodId", String(payload?.payment_method_id ?? ""));
        console.log("📌 Demo payment URL:", demoUrl.toString());
        setTimeout(() => {
          window.location.href = demoUrl.toString();
        }, 1000);
        return;
      }
      
      // If no URL and no booking code, show error
      showSingleToast("Payment gateway did not return redirect URL or booking details.");
    } catch (err: unknown) {
      const message = getErrorMessage(err) || "Booking creation failed. Please check your details and try again.";
      console.error("❌ Payment error:", {
        message,
        paymentMethodId: payload?.payment_method_id,
        error: err,
      });
      showSingleToast(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 9999
    }}>
      <Card className="w-100" style={{ maxWidth: '500px', margin: '0 20px' }}>
        <Card.Header style={{ backgroundColor: 'var(--primary)', color: '#fff' }} className="p-4">
          <h4 className="mb-0 fw-bold">Online Payment (Zainpay)</h4>
        </Card.Header>

        <Card.Body className="p-4">
          {/* Booking Summary */}
          <div className="mb-4 pb-4 border-bottom">
            <h6 className="fw-bold mb-3">Booking Details</h6>
            
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted small">Selected Seats:</span>
              <span className="fw-semibold">{payload?.booking_seat_numbers?.join(", ") || "—"}</span>
            </div>

            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted small">Number of Seats:</span>
              <span className="fw-semibold">{payload?.booking_seats?.length || 0}</span>
            </div>

            <div className="d-flex justify-content-between">
              <span className="text-muted small">Customer:</span>
              <span className="fw-semibold">{payload?.walkin_customer_name || "Walk-in Booking"}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="mb-4 p-3 rounded" style={{ backgroundColor: '#f0f7ff' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="small text-muted">Amount Due</div>
                <div className="h5 fw-bold text-primary">NGN 1000</div>
              </div>
              <div className="text-end">
                <div className="small text-muted">Payment Method</div>
                <div className="fw-bold">Zainpay</div>
              </div>
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="alert alert-info mb-4 small">
            ℹ️ Clicking &quot;Proceed to Payment&quot; will:
            <ol className="mb-0 mt-2 ps-3">
              <li>Create your booking</li>
              <li>Redirect to Zainpay for payment</li>
              <li>Return to confirm your ticket</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="d-flex gap-3">
            <Button
              variant="outline-secondary"
              className="flex-grow-1 fw-semibold"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              className="flex-grow-1 fw-semibold"
              onClick={handleOnlinePayment}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" /> Creating Booking...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
