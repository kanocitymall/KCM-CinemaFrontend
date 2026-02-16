import { Suspense } from 'react';
import AdminPaymentSuccessClient from './AdminPaymentSuccessClient';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <AdminPaymentSuccessClient />
    </Suspense>
  );
}