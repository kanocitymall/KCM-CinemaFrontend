"use client";
import React, { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, Form, Button, Spinner, InputGroup } from "react-bootstrap";
import { toast } from "react-toastify";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import SeatGrid from "./seat-grid";
import OnlinePaymentModal from "../components/OnlinePaymentModal";

interface BookingState {
  schedule_id: number | null;
  customer_id: number | null;
  walkin_customer_name: string;
  walkin_customer_no: string;
  walkin_customer_email: string;
  booking_seats: number[];
  booking_seat_numbers: string[];
  hall_id: number | null;
}

// payment-related types removed

interface Account {
  id: number;
  name: string;
  number?: string;
  payment_method_id?: number;
  payment_method?: { id?: number } | null;
}

interface OfflineMethod {
  id: number;
  name: string;
}

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialScheduleId = parseInt(searchParams?.get("schedule_id") || "0");
  const initialCustomerId = parseInt(searchParams?.get("customer_id") || "0");
  const initialHallId = parseInt(searchParams?.get("hall_id") || "0");

  const [currentStep, setCurrentStep] = useState<"customer" | "seats" | "confirm">(
    initialScheduleId ? "seats" : "customer"
  );

  const [bookingData, setBookingData] = useState<BookingState>({
    schedule_id: initialScheduleId || null,
    customer_id: initialCustomerId || null,
    walkin_customer_name: searchParams?.get("walkin_customer_name") || "",
    walkin_customer_no: searchParams?.get("walkin_customer_no") || "",
    walkin_customer_email: searchParams?.get("walkin_customer_email") || "",
    booking_seats: [],
    booking_seat_numbers: [],
    hall_id: initialHallId || null,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [offlineMethods, setOfflineMethods] = useState<OfflineMethod[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedOfflineMethodId, setSelectedOfflineMethodId] = useState<number | null>(null);
  const [offlineMethodId, setOfflineMethodId] = useState<number | null>(null);
  const [onlinePaymentMethodId, setOnlinePaymentMethodId] = useState<number | null>(null);
  const [seatRefreshTrigger, setSeatRefreshTrigger] = useState<number>(0);
  const [justBookedSeats, setJustBookedSeats] = useState<number[]>([]);
  const [blockedSeatIds, setBlockedSeatIds] = useState<number[]>([]);
  const [seatSummary, setSeatSummary] = useState<{ total: number; booked: number; available: number } | null>(null);
  const [showOnlineModal, setShowOnlineModal] = useState(false);

  // payment functionality removed from booking flow

  // payment methods and websocket removed

  // offline account removed — SeatGrid no longer needs payment props

  const handleSeatsSelected = (seatIds: number[], seatNumbers: string[]) => {
    setBookingData(prev => ({ 
      ...prev, 
      booking_seats: seatIds,
      booking_seat_numbers: seatNumbers 
    }));
    setCurrentStep("customer");
  };

  useEffect(() => {
    const api = getApiClientInstance();

    (async () => {
      try {
        // Fetch offline methods
        const resp = await api.get("/accounting/get-offline-method");
        const rawMethods = resp.data?.data;
        console.debug("get-offline-method raw:", resp.data, rawMethods);
        const methods = Array.isArray(rawMethods) ? rawMethods : (rawMethods ? [rawMethods] : []);
        console.debug("normalized offline methods:", methods);
        setOfflineMethods(methods as OfflineMethod[]);
        const offline = methods.find((m: OfflineMethod) => (m.name || '').toString().toLowerCase().includes('offline'));
        const offlineId = offline ? offline.id : null;
        setOfflineMethodId(offlineId);
        if (offlineId && !selectedOfflineMethodId) setSelectedOfflineMethodId(offlineId);

        // Fetch payment methods to find online/Zainpay method
        try {
          const respPayMethods = await api.get("/accounting/payment-methods");
          const payMethods = respPayMethods.data?.data || [];
          const pmArray = Array.isArray(payMethods) ? payMethods : [payMethods];
          const onlineMethod = pmArray.find((mItem: Record<string, unknown>) => {
            const name = String((mItem as Record<string, unknown>)?.name ?? "").toLowerCase();
            return name.includes("zainpay") || name.includes("online");
          });
          if (onlineMethod) {
            setOnlinePaymentMethodId(onlineMethod.id);
          }
        } catch (err) {
          console.debug('payment methods fetch failed:', err);
          // Fallback: use a default ID if the endpoint doesn't exist
          // This can be adjusted based on your backend
        }

        const respAcc = await api.get("/accounting/accounts");
        if (respAcc.data?.success) {
          const rawList = respAcc.data.data;
          console.debug("accounts raw:", respAcc.data, rawList);
          const list = Array.isArray(rawList) ? rawList : (rawList ? [rawList] : []);
          const filtered = offlineId ? (list as Account[]).filter((acc: Account) => acc.payment_method_id === offlineId || acc.payment_method?.id === offlineId) : (list as Account[]);
          setAccounts(filtered);
        }
      } catch (error: unknown) {
        console.debug('offline methods fetch failed', error);
      }
    })();
  }, [selectedOfflineMethodId]);

  const handleSubmitCounterBooking = async () => {
    if (bookingData.booking_seats.length === 0) return toast.error("Select seats");
    if (!selectedAccountId) return toast.error("Select account");
    const finalPaymethodId = selectedOfflineMethodId ?? offlineMethodId;
    if (!finalPaymethodId) return toast.error("Select payment method");
    
    try {
      setLoading(true);
      const api = getApiClientInstance();
      const payload = {
        ...bookingData,
        account_id: selectedAccountId,
        offline_method_id: selectedOfflineMethodId,
        paymethod_id: finalPaymethodId,
      };
      // debug: log payload to console so we can inspect what's sent
      console.debug("Counter booking payload:", payload);
      const response = await api.post("/bookings/counter-schedule-ticketing", payload);

      if (response.data?.success) {
        toast.success(response.data?.message || "Booking successful");
        const returned = response.data?.data;
        const bookingId = returned?.id;
        const seatIds = ((returned?.booking_seats || []) as Array<{ seat_id: number }>).map(bs => bs.seat_id);
        setJustBookedSeats(seatIds);
        const total = returned?.schedule?.hall?.total_seats ?? bookingData.booking_seats.length;
        const booked = (returned?.booking_seats || bookingData.booking_seats).length;
        const available = Math.max(0, total - booked);
        setSeatSummary({ total, booked, available });
        console.debug('Booking success! Incrementing refreshTrigger to re-fetch seats');
        setSeatRefreshTrigger(p => p + 1);
        // Redirect to booking detail page to download ticket
        setTimeout(() => {
          if (bookingId) {
            router.push(`/booking/booking-list/details/${bookingId}`);
          } else {
            router.push("/dashboard");
          }
        }, 2000);
      }
    } catch (error: unknown) {
      const apiErr = error as { response?: { data?: { message?: string; booked_seats?: number[] } } };
      toast.error(apiErr.response?.data?.message || "Error");
      const failedSeats = apiErr.response?.data?.booked_seats || [];
      if (failedSeats.length > 0) setBlockedSeatIds(prev => [...new Set([...prev, ...failedSeats])]);
      setSeatRefreshTrigger(p => p + 1);
      setCurrentStep("seats");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingData.walkin_customer_name || !bookingData.walkin_customer_no) {
      return toast.error("Required fields missing");
    }
    setCurrentStep("confirm");
  };


  return (
    <div className="py-5 bg-light min-vh-100">
      <div className="container-md" style={{ maxWidth: "600px" }}>
        {seatSummary && (
          <div className="mb-3">
            <Card className="p-3 border-0 shadow-sm">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="small text-muted">Seats</div>
                  <div className="fw-bold">Booked: {seatSummary.booked} / {seatSummary.total}</div>
                </div>
                <div className="text-end">
                  <div className="small text-muted">Available</div>
                  <div className="fw-bold">{seatSummary.available}</div>
                </div>
              </div>
            </Card>
          </div>
        )}
          <div className="mb-4 d-flex justify-content-center gap-2">
          {(['seats', 'customer', 'confirm'] as const).map((step, i) => (
            <div key={step} className="d-flex align-items-center">
              <div className={`step-circle ${currentStep === step ? 'step-active' : 'step-inactive'}`}>
                {i + 1}
              </div>
              {i < 2 && <div style={{ width: "30px", height: "2px", backgroundColor: "#dee2e6" }} />}
            </div>
          ))}
        </div>

        <Card className="border-0 shadow-sm">
          <Card.Header className="p-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
            <h4 className="mb-0">
              {currentStep === "seats" && "1. Seats"}
              {currentStep === "customer" && "2. Info"}
              {currentStep === "confirm" && "3. Payment"}
            </h4>
            <Button variant="light" size="sm" onClick={() => router.back()}>Back</Button>
          </Card.Header>

            {currentStep === "seats" && (
              <SeatGrid
                hallId={bookingData.hall_id!}
                scheduleId={bookingData.schedule_id}
                onSeatsSelected={handleSeatsSelected}
                loading={loading}
                refreshTrigger={seatRefreshTrigger}
                justBookedSeatIds={justBookedSeats}
                blockedSeatIds={blockedSeatIds}
              />
            )}

            {currentStep === "customer" && (
              <Form onSubmit={handleCustomerSubmit}>
                <div className="p-4">
                  <div className="text-center mb-3">
                    <h5 className="mb-1">Customer Information</h5>
                    <div className="small text-muted">Selected seats: {bookingData.booking_seat_numbers.join(", ") || 'None'}</div>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Full name</Form.Label>
                    <Form.Control
                      required
                      className="form-control-lg rounded"
                      placeholder="Full Name"
                      value={bookingData.walkin_customer_name}
                      onChange={e => setBookingData({...bookingData, walkin_customer_name: e.target.value})}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Phone</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-light">📞</InputGroup.Text>
                      <Form.Control
                        required
                        className="form-control-lg"
                        placeholder="Phone number"
                        value={bookingData.walkin_customer_no}
                        onChange={e => setBookingData({...bookingData, walkin_customer_no: e.target.value})}
                      />
                    </InputGroup>
                    <Form.Text className="text-muted">We may contact this number about the booking.</Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Email</Form.Label>
                    <Form.Control
                      type="email"
                      className="form-control-lg"
                      placeholder="Email address (optional)"
                      value={bookingData.walkin_customer_email}
                      onChange={e => setBookingData({...bookingData, walkin_customer_email: e.target.value})}
                    />
                  </Form.Group>

                  <div className="d-flex gap-2">
                    <Button variant="outline-secondary" onClick={() => setCurrentStep("seats")}>Back</Button>
                    <Button variant="warning" type="submit" className="flex-grow-1 fw-semibold">Continue</Button>
                  </div>
                </div>
              </Form>
            )}

            {currentStep === "confirm" && (
              <div className="p-4">
                <div className="row gx-4">
                  {/* Booking Summary Card */}
                  <div className="col-lg-5 mb-3">
                    <Card className="h-100 border-0 shadow-sm p-4" style={{ backgroundColor: '#f8f9fa' }}>
                      <h5 className="fw-bold mb-4">Booking Summary</h5>
                      
                      <div className="mb-3 pb-3 border-bottom">
                        <div className="small text-muted">SELECTED SEATS</div>
                        <div className="h5 fw-bold text-primary">{bookingData.booking_seat_numbers.join(", ") || 'None'}</div>
                      </div>

                      <div className="mb-3 pb-3 border-bottom">
                        <div className="small text-muted">NUMBER OF SEATS</div>
                        <div className="fw-semibold">{bookingData.booking_seats.length}</div>
                      </div>

                      <div className="mb-3 pb-3 border-bottom">
                        <div className="small text-muted">CUSTOMER NAME</div>
                        <div className="fw-semibold">{bookingData.walkin_customer_name || 'Not provided'}</div>
                      </div>

                      <div className="mb-3 pb-3 border-bottom">
                        <div className="small text-muted">CUSTOMER CONTACT</div>
                        <div className="fw-semibold">{bookingData.walkin_customer_no || 'Not provided'}</div>
                      </div>

                      <div className="mt-4 pt-3 border-top">
                        <div className="small text-muted">TOTAL AMOUNT</div>
                        <div className="h4 fw-bold text-success">—</div>
                        <div className="text-muted small">(Pricing to be added)</div>
                      </div>
                    </Card>
                  </div>

                  {/* Payment Options */}
                  <div className="col-lg-7">
                    {/* Online Payment Option */}
                    <Card className="border-0 shadow-sm mb-3 p-4" style={{ backgroundColor: '#e8f4f8', borderLeft: '4px solid var(--primary)' }}>
                      <div className="d-flex align-items-start justify-content-between">
                        <div>
                          <h5 className="fw-bold mb-1">Pay Online (Zainpay)</h5>
                          <p className="text-muted small mb-0">Secure online payment via Zainpay gateway</p>
                        </div>
                        <Button 
                          variant="primary" 
                          size="lg"
                          onClick={() => setShowOnlineModal(true)} 
                          disabled={loading || bookingData.booking_seats.length === 0}
                          className="fw-semibold"
                        >
                          {loading ? 'Processing...' : 'Pay Now'}
                        </Button>
                      </div>
                    </Card>

                    {/* Offline Payment Option */}
                    <Card className="border-0 shadow-sm p-4">
                      <h5 className="fw-bold mb-3">Pay Offline/Counter</h5>
                      
                      <div className="mb-3">
                        <Form.Label className="fw-semibold small">Select Offline Method</Form.Label>
                        <div className="d-flex flex-wrap gap-2">
                          {Array.isArray(offlineMethods) && offlineMethods.length > 0 ? offlineMethods.map(m => (
                            <button key={m.id} type="button" className={`btn btn-sm fw-semibold ${selectedOfflineMethodId === m.id ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setSelectedOfflineMethodId(m.id)}>{m.name}</button>
                          )) : (offlineMethodId ? (
                            <button type="button" className={`btn btn-sm fw-semibold ${selectedOfflineMethodId === offlineMethodId ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setSelectedOfflineMethodId(offlineMethodId)}>Offline</button>
                          ) : null)}
                        </div>
                      </div>

                      <div className="mb-4">
                        <Form.Label className="fw-semibold small">Select Account</Form.Label>
                        <Form.Select className="form-select-lg" value={selectedAccountId ?? ""} onChange={e => setSelectedAccountId(e.target.value ? parseInt(e.target.value) : null)}>
                          <option value="">— Select account —</option>
                          {Array.isArray(accounts) ? accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.number})</option>
                          )) : null}
                        </Form.Select>

                        {selectedAccountId && accounts.find(a => a.id === selectedAccountId) ? (
                          <div className="border rounded p-3 mt-2" style={{ backgroundColor: '#f0f7ff' }}>
                            <div className="fw-semibold">{accounts.find(a => a.id === selectedAccountId)?.name}</div>
                            <div className="small text-muted">{accounts.find(a => a.id === selectedAccountId)?.number}</div>
                          </div>
                        ) : null}
                      </div>

                      <div className="d-flex gap-2">
                        <Button variant="outline-secondary" onClick={() => setCurrentStep("customer")}>Back</Button>
                        <Button 
                          variant="warning" 
                          className="flex-grow-1 fw-semibold" 
                          onClick={handleSubmitCounterBooking} 
                          disabled={loading || bookingData.booking_seats.length === 0 || !selectedAccountId}
                        >
                          {loading && <Spinner size="sm" className="me-2" />} Confirm Counter Booking
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>

                {showOnlineModal && (
                  <OnlinePaymentModal
                    payload={{
                      ...bookingData,
                      payment_method_id: onlinePaymentMethodId,
                    }}
                    onClose={() => setShowOnlineModal(false)}
                  />
                )}
              </div>
            )}
        </Card>
      </div>
    </div>
  );
}

export default function ScheduleSeatBooking() {
  return (
    <Suspense fallback={<Spinner />}>
      <BookingContent />
    </Suspense>
  );
}