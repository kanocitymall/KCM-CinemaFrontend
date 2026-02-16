"use client";

import { use } from "react";
import { ConfirmPaymentForm } from "../ConfirmPaymentForm";

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const bookingId = parseInt(resolvedParams.id, 10);

  return (
    <ConfirmPaymentForm
      bookingIdProp={bookingId}
      onSuccess={undefined}
      onClose={undefined}
    />
  );
}


// ConfirmPaymentForm is exported from a dedicated client component file: ConfirmPaymentForm.tsx
