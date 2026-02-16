"use client";
import React from "react";
import { useRouter } from "next/navigation";

interface Booking {
  id: number;
  code: string;
  date: string;
  starttime: string;
  endtime: string;
  dueamount: string;
  amountpaid: string;
  balance: string;
  participants_checkin: number;
  participants_no: number;
  checkin_total: string;
  status: string;
  comment: string;
}

interface Account {
  id: number;
  name: string;
  number: string;
  description: string;
  acc_balance: string;
}

interface PaymentMethod {
  id: number;
  name: string;
  description: string;
}

interface Payment {
  id: number;
  booking_id: number;
  amount: string;
  transaction_date: string;
  status: string;
  booking: Booking;
  account: Account;
  payment_method: PaymentMethod;
}

interface Props {
  payment: Payment;
}

export default function IndividualPaymentView({ payment }: Props) {
  const router = useRouter();

  return (
    <div className="card shadow-sm p-4 mt-3">
      {/* Back Button */}
      <button
        className="btn btn-outline-secondary mb-3"
        onClick={() => router.back()}
      >
        &larr; Back
      </button>

      <h4 className="mb-3 text-primary">Payment Summary</h4>

      <div className="mb-3">
        <p><strong>Amount:</strong> ₦{Number(payment.amount).toLocaleString()}</p>
        <p><strong>Status:</strong> {payment.status}</p>
        <p><strong>Date:</strong> {new Date(payment.transaction_date).toLocaleDateString()}</p>
        <p><strong>Method:</strong> {payment.payment_method?.name}</p>
        <p><strong>Account:</strong> {payment.account?.name} ({payment.account?.description})</p>
      </div>

      <hr />
      <h5 className="mt-3 mb-2 text-secondary">Booking Details</h5>
      <p><strong>Code:</strong> {payment.booking?.code}</p>
      <p><strong>Date:</strong> {new Date(payment.booking?.date).toLocaleDateString()}</p>
      <p><strong>Due:</strong> ₦{Number(payment.booking?.dueamount).toLocaleString()}</p>
      <p><strong>Paid:</strong> ₦{Number(payment.booking?.amountpaid).toLocaleString()}</p>
      <p><strong>Balance:</strong> ₦{Number(payment.booking?.balance).toLocaleString()}</p>
      <p><strong>Status:</strong> {payment.booking?.status}</p>
      <p><strong>Comment:</strong> {payment.booking?.comment || "No comment"}</p>
    </div>
  );
}
