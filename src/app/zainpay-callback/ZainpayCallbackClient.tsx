"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getApiClientInstance } from "../utils/axios/axios-client";
import { Card, Button, Alert, Spinner } from "react-bootstrap";

type BookingVerification = {
  id?: number | string;
  booking_code?: string;
  seat_label?: string;
  movie_title?: string;
  hall_name?: string;
  qr_code?: string;
  status?: string;
};

type TransactionDetails = {
  reference?: string;
  amount?: number | string;
  customerName?: string;
  customerEmail?: string;
  timestamp?: string;
} | null;

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const maybe = err as { response?: { data?: { message?: string } }; message?: string };
    return maybe.response?.data?.message || maybe.message || "Failed to verify payment.";
  }
  return "Failed to verify payment.";
}

export default function ZainpayCallbackClient() {
  const search = useSearchParams();
  const router = useRouter();

  const paymentRef = search?.get("reference") || search?.get("payment_ref") || search?.get("ref") || undefined;
  const zainpayStatus = search?.get("status") || undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingVerification | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetails>(null);

  useEffect(() => {
    async function verifyPayment() {
      if (!paymentRef) {
        setError("Missing payment reference. Unable to verify payment.");
        setLoading(false);
        return;
      }

      try {
        const api = getApiClientInstance();
        const res = await api.get(`/bookings/verify-payment/${paymentRef}`);
        const data = res?.data?.data;

        const status = data?.status || data?.payment_status || "pending";

        if (status && String(status).toLowerCase() === "approved") {
          const seatLabel = data?.booking_seats?.[0]?.seat?.label || data?.seat_label || data?.seat || "—";
          const movieTitle = data?.schedule?.program?.title || data?.movie_title || data?.movieTitle || data?.title || "—";
          const hallName = data?.schedule?.hall?.name || data?.hall_name || data?.hallName || data?.hall || "—";

          setBooking({
            id: data?.id || data?.booking_id,
            booking_code: data?.code || data?.booking_code || data?.bookingCode || "—",
            seat_label: seatLabel,
            movie_title: movieTitle,
            hall_name: hallName,
            qr_code: data?.qr_code || data?.qr || data?.qrCode,
            status: "Approved",
          });

          setTransactionDetails({
            reference: paymentRef,
            amount: data?.dueamount || data?.amount,
            customerName: data?.walkin_customer_name || data?.customer?.name || "—",
            customerEmail: data?.walkin_customer_email || data?.customer?.email || "—",
            timestamp: new Date().toLocaleString(),
          });
        } else if (String(status).toLowerCase() === "pending") {
          setError("Payment is still being processed. Your booking will be confirmed shortly.");
        } else {
          setError(`Payment verification failed. Status: ${status}. Please contact support.`);
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();
  }, [paymentRef, zainpayStatus]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5", padding: "20px" }}>
        <Card style={{ maxWidth: "500px", width: "100%" }} className="border-0 shadow-lg p-5">
          <div className="text-center">
            <Spinner animation="border" role="status" className="mb-3" />
            <h5 className="fw-bold">Processing Your Payment</h5>
            <p className="text-muted small mt-2">Thank you for your payment. We are verifying your transaction...</p>
            <div className="small text-muted mt-3">Reference: {paymentRef}</div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Card style={{ maxWidth: 600, width: "100%" }} className="border-0 shadow-lg">
          <Card.Header style={{ backgroundColor: "#dc3545", color: "#fff" }} className="p-4 text-center">
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h4 className="mb-0 fw-bold">Payment Verification Failed</h4>
          </Card.Header>
          <Card.Body>
            <Alert variant="danger">{error}</Alert>
            <div className="bg-light p-3 rounded mb-4 small">
              <p className="mb-1"><strong>Payment Reference:</strong></p>
              <p className="font-monospace text-break mb-0">{paymentRef || "Not provided"}</p>
            </div>
            <div className="d-flex gap-2">
              <Button onClick={() => window.location.reload()}>🔄 Try Again</Button>
              <Button variant="outline-secondary" onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const bookingDetailsUrl = booking?.id ? `/booking/booking-list/details/${booking.id}` : "/dashboard";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5", padding: "40px 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card style={{ maxWidth: 600, width: "100%" }} className="border-0 shadow-lg">
        <Card.Header style={{ backgroundColor: "#28a745", color: "#fff" }} className="p-4 text-center">
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h4 className="mb-0 fw-bold">Transaction Successful</h4>
        </Card.Header>
        <Card.Body>
          <Alert variant="success">Payment Confirmed! Your booking has been successfully created.</Alert>

          <div className="mb-4 pb-4 border-bottom">
            <h6 className="fw-bold mb-3">Transaction Details</h6>
            <div className="d-flex justify-content-between mb-2"><span className="text-muted small">Payment Reference:</span><span className="fw-monospace small">{transactionDetails?.reference}</span></div>
            <div className="d-flex justify-content-between mb-2"><span className="text-muted small">Amount:</span><span className="fw-semibold">NGN {transactionDetails?.amount || "—"}</span></div>
            <div className="d-flex justify-content-between mb-2"><span className="text-muted small">Customer Name:</span><span className="fw-semibold">{transactionDetails?.customerName}</span></div>
          </div>

          <div className="mb-4 pb-4 border-bottom">
            <h6 className="fw-bold mb-3">Booking Details</h6>
            <div className="row mb-3">
              <div className="col-6"><div className="small text-muted">BOOKING CODE</div><div className="fw-bold text-primary" style={{ fontSize: 16 }}>{booking?.booking_code || "—"}</div></div>
              <div className="col-6"><div className="small text-muted">SEAT</div><div className="fw-bold" style={{ fontSize: 16 }}>{booking?.seat_label || "—"}</div></div>
            </div>
            <div className="row"><div className="col-6"><div className="small text-muted">MOVIE</div><div className="fw-semibold small">{booking?.movie_title || "—"}</div></div><div className="col-6"><div className="small text-muted">HALL</div><div className="fw-semibold small">{booking?.hall_name || "—"}</div></div></div>
          </div>

          {booking?.qr_code && (
            <div className="text-center mb-4 pb-4 border-bottom">
              <div className="small text-muted mb-2">TICKET QR CODE</div>
              <Image alt="ticket-qr" src={booking.qr_code} width={150} height={150} unoptimized />
            </div>
          )}

          <div className="d-flex gap-2">
            <Button className="flex-grow-1 fw-semibold" onClick={() => router.push(bookingDetailsUrl)}>📄 View Booking Details & Download PDF</Button>
            <Button variant="outline-secondary" className="flex-grow-1 fw-semibold" onClick={() => window.print()}>🖨️ Print Ticket</Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
