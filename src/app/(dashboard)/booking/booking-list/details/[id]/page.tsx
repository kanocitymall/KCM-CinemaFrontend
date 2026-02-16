'use client';

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import PageHeader from "../../../../components/page-header";
import Loading from "../../../../components/loading";
import { toast } from "react-toastify";
import { isAxiosError } from "axios";
import { IoArrowBackOutline, IoPrintOutline, IoTrashOutline, IoDownloadOutline } from "react-icons/io5";
import PermissionGuard from "../../../../components/PermissionGuard";
// Import both the canvas generator and the new PDF generator
import {  downloadTicketsAsPDF, } from "@/app/utils/ticketHelper";

interface Seat {
  id: number;
  label: string;
  seat_row: string;
  seat_number: number;
  seat_type: string;
}

interface BookingSeat {
  id: number;
  price: string;
  status: string;
  qr_code: string;
  checkin_status?: 'checked_in' | 'not_checked_in';
  seat: Seat;
}

interface BookingDetails {
  id: number;
  code: string;
  number_of_seats: number;
  dueamount: string;
  booking_time: string;
  walkin_customer_name: string;
  walkin_customer_no: string;
  walkin_customer_email: string;
  customer_id?: number | null;
  customer?: {
    id: number;
    name: string;
    phoneno: string;
    email: string;
  } | null;
  status: string;
  schedule: {
    details: string;
    date: string;
    starttime: string;
    endtime: string;
    regular_price: string;
    vip_price: string;
    hall_id?: number;
    hall?: { name: string; id: number };
    hall_name?: string;
  };
  booking_seats: BookingSeat[];
}

const BookingShowPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const api = useMemo(() => getApiClientInstance(), []);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/bookings/show-booking/${id}`);
        if (res.data.success) {
          // Merge schedule details into booking
          const bookingData = res.data.data.booking || res.data.data;
          const scheduleData = res.data.data.schedule;
          
          // Combine booking with schedule details
          if (scheduleData && bookingData) {
            bookingData.schedule = {
              ...bookingData.schedule,
              ...scheduleData,
              hall_name: scheduleData.hall?.name || scheduleData.hall_name || `Hall ${scheduleData.hall_id}`
            };
          }
          
          setBooking(bookingData);
        } else {
          toast.error(res.data.message || "Booking not found");
        }
      } catch (error: unknown) {
        if (isAxiosError(error)) {
          toast.error(error.response?.data?.message || "Error fetching details");
        } else {
          toast.error("Error fetching details");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBookingDetails();
  }, [id, api]);



  // Handle Bulk Ticket Download (PDF - 4 per page)
  const handleDownloadAllPDF = async (): Promise<void> => {
    if (!booking) return;
    try {
      toast.info("Generating PDF tickets with QR codes...");
      const info = { 
        companyName: "Kano City Mall", 
        date: booking.schedule.date 
      };
      await downloadTicketsAsPDF(booking, booking.booking_seats, info);
      toast.success("All tickets with QR codes downloaded as PDF!");
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error("Failed to generate PDF");
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    try {
      setIsDeleting(true);
      const res = await api.delete(`/bookings/delete-booking/${id}`);
      if (res.data.success) {
        toast.success("Booking deleted successfully");
        router.push("/booking/booking-list");
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Delete failed");
      } else {
        toast.error("Delete failed");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return "N/A";
    return new Date(timeStr.replace(" ", "T")).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) return <Loading />;
  if (!booking) return <div className="p-5 text-center">Booking not found.</div>;

  return (
    <section className="container-fluid pb-5 pt-5 pt-md-3">
      <PageHeader title={`Details: ${booking.code}`}>
        <div className="d-flex gap-2">
          {booking.status.toLowerCase() === "pending" && (
            <PermissionGuard permission="Delete booking">
              <button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2"
              >
                {isDeleting ? "Deleting..." : <><IoTrashOutline /> Delete</>}
              </button>
            </PermissionGuard>
          )}
          <button onClick={() => router.back()} className="btn btn-outline-dark btn-sm d-flex align-items-center gap-2">
            <IoArrowBackOutline /> Back
          </button>
        </div>
      </PageHeader>

      <div className="d-block d-md-none" style={{ height: '4rem' }} />

      <div className="row mt-4 g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white fw-bold py-3">Customer Information</div>
            <div className="card-body">
              <div className="row">
                <div className="col-12 col-sm-6 mb-3">
                  <label className="text-muted small d-block">Full Name</label>
                  <span className="fw-semibold">
                    {booking.walkin_customer_name || booking.customer?.name || 'N/A'}
                  </span>
                </div>
                <div className="col-12 col-sm-6 mb-3">
                  <label className="text-muted small d-block">Phone Number</label>
                  <span>{booking.walkin_customer_no || booking.customer?.phoneno || 'N/A'}</span>
                </div>
                <div className="col-12 col-sm-6 mb-3">
                  <label className="text-muted small d-block">Email Address</label>
                  <span>{booking.walkin_customer_email || booking.customer?.email || 'N/A'}</span>
                </div>
                <div className="col-12 col-sm-6 mb-3">
                  <label className="text-muted small d-block">Status</label>
                  <span className={`badge ${booking.status === 'Approved' ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white fw-bold py-3">Event & Schedule</div>
            <div className="card-body">
              <p className="mb-4 text-secondary">{booking.schedule.details}</p>
              <div className="row text-center bg-light p-3 rounded mx-0">
                <div className="col-12 col-sm-4 border-end">
                  <div className="text-muted x-small uppercase">Date</div>
                  <div className="fw-bold">{booking.schedule.date}</div>
                </div>
                <div className="col-12 col-sm-4 border-end">
                  <div className="text-muted x-small uppercase">Start</div>
                  <div className="fw-bold">{formatTime(booking.schedule.starttime)}</div>
                </div>
                <div className="col-12 col-sm-4">
                  <div className="text-muted x-small uppercase">End</div>
                  <div className="fw-bold">{formatTime(booking.schedule.endtime)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm bg-primary text-white mb-4">
            <div className="card-body py-4">
              <h5 className="card-title opacity-75 small mb-1">TOTAL DUE</h5>
              <h2 className="fw-bold">₦{Number(booking.dueamount).toLocaleString()}</h2>
              <hr className="opacity-25" />
              <div className="d-flex justify-content-between small">
                <span>Quantity:</span>
                <span className="fw-bold">{booking.number_of_seats} Seats</span>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <span className="fw-bold">Seats Details</span>
              {/* PDF Bulk Download Button */}
              {booking.booking_seats.length > 0 && (
                <button 
                  onClick={handleDownloadAllPDF}
                  className="btn btn-primary btn-sm d-flex align-items-center gap-2"
                  style={{ fontSize: '0.75rem' }}
                >
                  <IoDownloadOutline size={14} /> Download All (PDF)
                </button>
              )}
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                {booking.booking_seats.map((item) => (
                  <li key={item.id} className="list-group-item py-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <div>
                          <div className="fw-bold text-primary">Seat {item.seat.label}</div>
                          <div className="x-small text-muted">{item.seat.seat_type} | Row {item.seat.seat_row}</div>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="fw-semibold small">₦{Number(item.price).toLocaleString()}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-footer bg-white border-0 py-3">
              <button className="btn btn-dark w-100 d-flex align-items-center justify-content-center gap-2" onClick={() => window.print()}>
                <IoPrintOutline /> <span className="d-none d-sm-inline">Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingShowPage;