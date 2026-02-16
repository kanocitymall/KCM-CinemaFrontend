"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// --- Updated Interfaces ---
interface Seat {
  label: string;
  seat_type: string;
}

interface BookingSeat {
  id: number;
  qr_code: string;
  seat: Seat;
}

interface BookingData {
  id: number; 
  code: string;
  walkin_customer_name: string;
  walkin_customer_email: string;
  walkin_customer_phone: string; // Added phone
  dueamount: number;             // Added amount
  booking_seats: BookingSeat[];
  schedule: {
    date: string;
    starttime: string;
    hall: { name: string };
    program: { title: string };
  };
}

export default function AdminPaymentSuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = searchParams.get('ref');

  const [loading, setLoading] = useState<boolean>(true);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (!ref) {
      setError("No reference ID found in the URL.");
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      setError(null);
      try {
        const response = await fetch(
          `https://cinemaapi.kanocitymall.com.ng/api/v1/bookings/verify-payment/${ref}`
        );

        const json = await response.json();

        if (response.ok && json.success && json.data) {
          setBookingData(json.data);
          
          const bookingId = json.data.id; 
          timeoutId = setTimeout(() => {
            router.push(`/booking/booking-list/details/${bookingId}`);
          }, 5000); 
        } else {
          setError(json.message || "Payment verification failed.");
        }
      } catch {
        setError("Network error: Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [ref, router]);

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-sm text-gray-400 font-bold tracking-widest uppercase">Loading</p>
    </div>
  );

  // LOGIC FIX: Don't show the error screen if we actually have booking data to show
  if (error && !bookingData) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-red-100 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-3">Verification Failed</h2>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed font-medium">{error}</p>
        <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()} className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-black transition shadow-lg">Try Again</button>
            <button onClick={() => router.push('/booking/booking-list')} className="w-full bg-white text-gray-600 py-3.5 rounded-xl font-bold text-sm border border-gray-200 hover:bg-gray-50 transition">Back to Bookings</button>
        </div>
      </div>
    </div>
  );

  if (!bookingData) return null;

  const { schedule, booking_seats, walkin_customer_name, walkin_customer_email, walkin_customer_phone, code, dueamount, id } = bookingData;

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-md">
        
        <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl mb-6 flex items-center shadow-xl shadow-emerald-100/50">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 mr-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-sm font-bold tracking-tight">Payment Success! Ticket Ready.</span>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden relative border border-gray-200/40">
          <div className="bg-slate-900 px-8 py-7 text-white text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold mb-2">Electronic Movie Ticket</p>
            <h2 className="text-2xl font-black leading-tight">{schedule?.program?.title}</h2>
          </div>

          <div className="px-8 pb-8 pt-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-8">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Date</p>
                <p className="text-sm font-bold text-gray-800">{schedule?.date}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Time</p>
                <p className="text-sm font-bold text-gray-800">{formatTime(schedule?.starttime)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Hall</p>
                <p className="text-sm font-bold text-gray-800">{schedule?.hall?.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Seats</p>
                <p className="text-sm font-black text-blue-600 uppercase">
                  {booking_seats?.map(s => s.seat.label).join(", ")}
                </p>
              </div>
            </div>

            {/* --- CUSTOMER DETAILS SECTION --- */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-8">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-[10px] text-gray-400 uppercase font-black">Customer</span>
                  <span className="text-xs font-bold text-gray-800">{walkin_customer_name}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-[10px] text-gray-400 uppercase font-black">Email</span>
                  <span className="text-xs font-bold text-gray-800">{walkin_customer_email}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-[10px] text-gray-400 uppercase font-black">Phone</span>
                  <span className="text-xs font-bold text-gray-800">{walkin_customer_phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-[10px] text-gray-400 uppercase font-black">Total Amount</span>
                  <span className="text-sm font-black text-gray-900">₦{dueamount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-6 border border-gray-100 rounded-[1.5rem] bg-gray-50/50">
              <p className="text-[9px] text-gray-400 font-bold tracking-[0.3em] uppercase mb-1">Booking Reference</p>
              <p className="text-xs font-mono font-bold text-gray-600">{code}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button 
            onClick={() => router.push(`/booking/booking-list/details/${id}`)}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-200"
          >
            Go to Details Page
          </button>
        </div>
      </div>
    </div>
  );
}