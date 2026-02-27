"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Card, Button, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import CameraScanner from "@/app/(dashboard)/booking/chack-in/cameraScanner";
import { downloadSingleQRCodePDF } from '@/app/utils/ticketHelper';
import { QRCodeDisplay } from '@/app/(dashboard)/booking/components/QRCodeDisplay';
import { formatTimeTo12Hour } from '@/app/utils';
import { ScheduleInfo } from '@/app/utils/bookingService';

// scheduleInfo coming from API may include additional optional fields used by UI
// such as program_name, hall object, and title. Define an extended type locally
// so that we can safely access those properties without TypeScript complaints.
interface ExtendedScheduleInfo extends ScheduleInfo {
  program_name?: string;
  title?: string;
  hall?: { name?: string; id?: number };
  hall_name?: string;
}

const ParticipantsCheckInPage: React.FC = () => {
  const params = useParams();
  const scheduleId = params?.id as string;
  const api = getApiClientInstance();

  const [loading, setLoading] = useState(true);
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [scheduleInfo, setScheduleInfo] = useState<ExtendedScheduleInfo | null>(null);
  const [hallName, setHallName] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const lastFetchRef = useRef<number>(0);
  const retryTimeoutRef = useRef<number | null>(null);
  const seatsLastFetchRef = useRef<number>(0);

  // Caches to prevent repeated API calls for the same resource
  const programCacheRef = useRef<Record<number, { title: string }>>({});
  const hallCacheRef = useRef<Record<number, { name: string }>>({});

  // Seats / PDF download state
  const [seats, setSeats] = useState<any[]>([]);
  const [seatsLoading, setSeatsLoading] = useState<boolean>(true);
  const [has404Error, setHas404Error] = useState<boolean>(false);

  const fetchScheduleSeats = useCallback(async () => {
    if (!scheduleId) return;
    // prevent rapid repeated requests
    const now = Date.now();
    if (now - (seatsLastFetchRef.current || 0) < 1000) return;
    seatsLastFetchRef.current = now;

    setSeatsLoading(true);
    try {
      const res = await api.get(`/bookings/schedule-hall-seats/${scheduleId}`);
      const payload = res?.data;
      if (!payload?.success) {
        toast.error(payload?.message || "Failed to fetch seat assignments");
        setSeats([]);
        return;
      }

      // payload.data may be array or object with data field
      let dataArray: any[] = [];
      if (Array.isArray(payload.data)) dataArray = payload.data;
      else if (payload.data && Array.isArray(payload.data.data)) dataArray = payload.data.data;
      else if (payload.data) dataArray = [payload.data];

      setSeats(dataArray);
    } catch (err) {
      console.error('Failed to fetch schedule-hall-seats', err);
      toast.error('Failed to fetch seat assignments');
      setSeats([]);
    } finally {
      setSeatsLoading(false);
    }
  }, [api, scheduleId]);

  useEffect(() => {
    if (!scheduleId) return;
    // Fetch participants and seats together once when scheduleId becomes available
    fetchParticipants();
    fetchScheduleSeats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId]);

  const downloadSeatPDF = useCallback(async (s: any) => {
    try {
      // Build minimal booking and seat objects expected by downloadSingleQRCodePDF
      const booking = {
        id: s.booking_id || s.booking?.id || s.id || 0,
        code: s.booking_code || s.booking?.code || `BK-${s.id || 'unknown'}`,
        number_of_seats: 1,
        dueamount: s.price || s.booking?.dueamount || '0',
        booking_time: s.created_at || s.booking?.booking_time || '',
        walkin_customer_name: s.customer_name || s.name || s.customer?.name || '',
        customer: s.customer || null,
        status: s.status || s.booking?.status || 'Confirmed',
        schedule: {
          details: s.schedule?.details || s.program_details || '',
          date: s.schedule?.date || s.date || '',
          starttime: s.schedule?.starttime || s.starttime || '',
          endtime: s.schedule?.endtime || s.endtime || '',
          hall_id: s.schedule?.hall_id || s.hall_id || undefined,
          hall_name: s.schedule?.hall?.name || s.hall?.name || s.hall_name || undefined,
        },
        booking_seats: [],
      } as any;

      const seat = {
        id: s.id || s.seat_id || s.booking_seat_id || 0,
        price: s.price || s.booking?.price || '0',
        status: s.status || 'active',
        qr_code: s.qr_code || s.booking?.qr_code || '',
        checkin_status: s.checkin_status || s.booking?.checkin_status || undefined,
        seat: s.seat || s.seat_info || s.seat_detail || { label: s.seat_label || s.label || '' },
      } as any;

      const info = {
        companyName: 'Kano City Mall',
        date: booking.schedule.date || new Date().toISOString().split('T')[0],
      };

      await downloadSingleQRCodePDF(booking, seat, info);
      toast.success('PDF downloaded');
    } catch (err) {
      console.error('PDF download failed', err);
      toast.error('Failed to download PDF');
    }
  }, []);

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    try {
      // Prevent immediate repeated requests
      const now = Date.now();
      if (now - (lastFetchRef.current || 0) < 1000) return;

      // If we already hit a 404, don't keep retrying
      if (has404Error) {
        setLoading(false);
        return;
      }

      const res = await api.get(`/bookings/schedule-bookings/${scheduleId}?page=${currentPage}`);
      const payload = res?.data;
      lastFetchRef.current = Date.now();
      if (!payload?.success) {
        toast.error(payload?.message || "Failed to fetch participants");
        setBookingsList([]);
        setHas404Error(true);
        setLoading(false);
        return;
      }

      // Response shape can be:
      // { success: true, data: [ ... ] }
      // or { success: true, data: { schedule: {...}, bookings: { data: [ ... ] } } }
      let bookingsArray: any[] = [];

      const d = payload.data;
      if (Array.isArray(d)) {
        bookingsArray = d;
      } else if (d) {
        if (Array.isArray(d.bookings)) {
          bookingsArray = d.bookings;
        } else if (d.bookings && Array.isArray(d.bookings.data)) {
          bookingsArray = d.bookings.data;
        } else if (Array.isArray(d.data)) {
          bookingsArray = d.data;
        }
      }

      // Keep a structured bookings list for rendering customer cards + seats
      setBookingsList(bookingsArray);

      // Extract pagination info if available
      if (d?.bookings && typeof d.bookings === 'object' && !Array.isArray(d.bookings)) {
        setTotalPages(d.bookings.last_page || 1);
        setTotalBookings(d.bookings.total || 0);
      } else {
        setTotalPages(1);
        setTotalBookings(bookingsArray.length);
      }

      // capture schedule info if present
      const sched = d?.schedule || payload?.data?.schedule || null;
      if (sched) {
        // create a mutable copy to enrich before updating state
        const enriched: ExtendedScheduleInfo = { ...sched } as any;

        // if the schedule lacks a human-readable title, fetch it once
        if (
          enriched.program_id &&
          (!enriched.details || enriched.details.toLowerCase() === 'null')
        ) {
          try {
            // Check cache first to avoid repeated 429 errors
            if (programCacheRef.current[enriched.program_id]) {
              enriched.details = programCacheRef.current[enriched.program_id].title;
            } else {
              const progRes = await api.get(`/programs/show-program/${enriched.program_id}`);
              if (progRes.data.success && progRes.data.data) {
                const title = progRes.data.data.title || '';
                programCacheRef.current[enriched.program_id] = { title };
                enriched.details = title || enriched.details || '';
              }
            }
          } catch (err) {
            console.debug('Failed to fetch program name for schedule:', err);
          }

          // if lookup left us with nothing, provide a sensible placeholder
          if (!enriched.details) {
            enriched.details = `Program #${enriched.program_id}`;
          }
        }

        // update schedule info with whatever we currently have (possibly enriched)
        setScheduleInfo(enriched);

        // fetch hall name if hall_id present
        try {
          const hid = enriched.hall_id || enriched.hall?.id || enriched.hall_id;
          if (hid) {
            // Check cache first to avoid repeated 429 errors
            if (hallCacheRef.current[hid]) {
              setHallName(hallCacheRef.current[hid].name);
            } else {
              const hr = await api.get(`/halls/get-hall/${hid}`);
              const hname = hr?.data?.data?.name || hr?.data?.name || hr?.data?.hall_name || `Hall ${hid}`;
              hallCacheRef.current[hid] = { name: hname };
              setHallName(hname);
            }
          } else {
            setHallName(null);
          }
        } catch (e) {
          console.warn('Failed to fetch hall name', e);
          setHallName(null);
        }
      } else {
        setScheduleInfo(null);
        setHallName(null);
      }
    } catch (err: any) {
      console.error(err);
      const status = err?.response?.status;
      // Handle 404: schedule doesn't exist or has no participants
      if (status === 404) {
        console.warn('Schedule or bookings not found (404)');
        setBookingsList([]);
        setHas404Error(true);
        // Don't show toast for 404; it's expected when schedule is empty
      } else if (status === 429) {
        // Handle rate limiting (429) by respecting Retry-After header if present
        const retryAfter = parseInt(err.response?.headers?.["retry-after"] || "0") || 5;
        toast.warn(`Rate limited by server. Retrying in ${retryAfter}s`);
        // schedule one retry
        if (retryTimeoutRef.current) window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = window.setTimeout(() => {
          fetchParticipants();
        }, retryAfter * 1000) as unknown as number;
      } else {
        toast.error("Failed to fetch participants");
        setBookingsList([]);
      }
    } finally {
      setLoading(false);
    }
  }, [api, scheduleId, currentPage, has404Error]);

  useEffect(() => {
    if (scheduleId) {
      setCurrentPage(1); // Reset to page 1 when scheduleId changes
      fetchParticipants();
    }
  }, [fetchParticipants, scheduleId]);

  const handleSuccessfulScan = (data: any) => {
    try {
      const id = data?.id || data?.booking?.id || data?.seat?.id;
      if (id) {
        // Refresh list from server to reflect check-in status
        fetchParticipants();
        toast.success("Participant checked in");
      } else {
        fetchParticipants();
      }
    } catch (err) {
      console.error(err);
      fetchParticipants();
    }
  };

  return (
    <section className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <Card className="mb-4">
            <Card.Header className="bg-light">Participant Check-In</Card.Header>
            <Card.Body>
              <p className="small text-muted">Scan participant QR codes to check them in.</p>
              <div className="d-flex justify-content-center mb-3">
                <CameraScanner scheduleId={scheduleId ? Number(scheduleId) : undefined} onSuccessfulScan={handleSuccessfulScan} />
              </div>

              {/* Schedule info */}
              <div className="mb-3">
                <div className="d-flex gap-3 align-items-center">
                  <div><strong>Program:</strong> {scheduleInfo?.details || scheduleInfo?.program_name || 'N/A'}</div>
                  <div><strong>Hall:</strong> {hallName || scheduleInfo?.hall?.name || 'N/A'}</div>
                  <div><strong>Date:</strong> {scheduleInfo?.date || 'N/A'}</div>
                  <div><strong>Time:</strong> {scheduleInfo?.starttime ? `${formatTimeTo12Hour(scheduleInfo.starttime)}${scheduleInfo?.endtime ? ` - ${formatTimeTo12Hour(scheduleInfo.endtime)}` : ''}` : 'N/A'}</div>
                </div>
              </div>

              {/* Seat assignments / PDF downloads */}
              <h6 className="mb-3">Seat </h6>
              {seatsLoading ? (
                <p>Loading seat ...</p>
              ) : seats.length === 0 ? (
                <p className="text-muted">No seat assignments found.</p>
              ) : (
                seats
                  .filter((s) => {
                    const name = s.customer_name || s.name || s.customer?.name;
                    const seatLabel = s.seat_label || s.seat || s.label || '';
                    // exclude seats with no customer name or no meaningful seat label
                    if (!name) return false;
                    if (!seatLabel || seatLabel === '-') return false;
                    return true;
                  })
                  .map((s, idx) => (
                    <div key={s.id ?? s.seat_id ?? s.booking_id ?? `seat-${idx}`} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <div>
                        <div className="fw-semibold">{s.customer_name || s.name || s.customer?.name}</div>
                        <div className="small text-muted">Seat: {s.seat_label || s.seat || s.label}</div>
                      </div>
                      <div>
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => downloadSeatPDF(s)}>PDF</Button>
                      </div>
                    </div>
                  ))
              )}

              <hr />
              <h6 className="mb-3">Participants</h6>
              {loading && !has404Error ? (
                <p>Loading...</p>
              ) : bookingsList.length === 0 || has404Error ? (
                <p className="text-muted">No participants found for this schedule.</p>
              ) : (
                bookingsList.map((b, bi) => (
                  <Card key={b.id ?? `booking-${bi}`} className="mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-semibold">{b.walkin_customer_name || b.customer?.name || 'Guest'}</div>
                          <div className="small text-muted">Booking: {b.code || b.id}</div>
                        </div>
                        <div>
                          <Badge bg={b.booking_seats?.some((s: any) => s.checkin_status === 'checked_in') ? 'success' : 'secondary'}>
                            {b.booking_seats?.some((s: any) => s.checkin_status === 'checked_in') ? 'Checked In' : 'Not Checked In'}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-3">
                        {(b.booking_seats || []).map((s: any, si: number) => (
                          <div key={s.id ?? `seat-${si}`} className="d-flex justify-content-between align-items-center py-2 border-top">
                            <div>
                              <div className="fw-medium">{s.seat?.label || s.seat_label || `${s.seat?.seat_row || ''}${s.seat?.seat_number || ''}`}</div>
                              <div className="small text-muted">Price: ₦{s.price ? String(Math.round(Number(s.price))) : '0'}</div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              {(() => {
                                const sched = b.schedule || b?.booking?.schedule || scheduleInfo || {};
                                const prog = sched.details || sched.program_name || sched.title || scheduleInfo?.details || scheduleInfo?.program_name || '';
                                const hallName_local = sched.hall?.name || sched.hall_name || hallName || scheduleInfo?.hall?.name || '';
                                const hall = hallName_local || (scheduleInfo?.hall_id ? `Hall ${scheduleInfo.hall_id}` : '');
                                const date = sched.date || scheduleInfo?.date || '';
                                const st = sched.starttime || scheduleInfo?.starttime || '';
                                const et = sched.endtime || scheduleInfo?.endtime || '';
                                // Extract time part from full datetime if present
                                const stTime = st ? st.includes(' ') ? st.split(' ')[1] : st : '';
                                const etTime = et ? et.includes(' ') ? et.split(' ')[1] : et : '';
                                return (
                                  <QRCodeDisplay
                                    qrCodeValue={s.qr_code || ''}
                                    bookingCode={String(b.code || b.id)}
                                    seatLabel={s.seat?.label || ''}
                                    customerName={b.walkin_customer_name || b.customer?.name || ''}
                                    program={prog}
                                    hall={hall}
                                    date={date}
                                    starttime={stTime ? formatTimeTo12Hour(stTime) : undefined}
                                    endtime={etTime ? formatTimeTo12Hour(etTime) : undefined}
                                    onDownloadPDF={async () => {
                                      try {
                                        // include schedule data from parent state if it's missing on the booking
                                        const bookingForPdf = { ...b, schedule: b.schedule || scheduleInfo } as any;
                                        const seatForPdf = { ...s } as any;
                                        const info = {
                                          companyName: 'Kano City Mall',
                                          date: bookingForPdf.schedule?.date || scheduleInfo?.date || '',
                                          // supply program name if available (scheduleInfo.details may have been populated above)
                                          programName: bookingForPdf.schedule?.details || scheduleInfo?.details || ''
                                        };
                                        await downloadSingleQRCodePDF(bookingForPdf, seatForPdf, info);
                                        toast.success('PDF downloaded');
                                      } catch (err) {
                                        console.error('PDF download failed', err);
                                        toast.error('Failed to download PDF');
                                      }
                                    }}
                                  />
                                );
                              })()}
                              <div>
                                <Badge bg={s.checkin_status === 'checked_in' ? 'success' : 'secondary'}>
                                  {s.checkin_status === 'checked_in' ? 'Checked In' : (s.checkin_status ? String(s.checkin_status) : 'Not Checked In')}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                ))
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                  <div className="small text-muted">
                    Page {currentPage} of {totalPages} ({totalBookings} total bookings)
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      disabled={currentPage === 1 || loading}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      disabled={currentPage === totalPages || loading}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ParticipantsCheckInPage;
