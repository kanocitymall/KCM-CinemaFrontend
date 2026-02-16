"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { toast } from "react-toastify";
import { Spinner, Button, Modal } from "react-bootstrap";
import Link from "next/link";
import PageHeader from "../../components/page-header";
import Loading from "../../components/loading";

// --- Interfaces ---

interface Agent {
  id: number | string;
  name?: string;
  code?: string;
  agent_code?: string;
  agent_user_code?: string;
}

interface Hall {
  id: number | string;
  name?: string;
}

interface Client {
  id: number | string;
  name?: string;
  email?: string;
}

interface Booking {
  id: number;
  code: string;
  title: string;
  status: string;
  date: string;
  agent_id?: string | number;
  agent?: Agent;
  client_id?: string | number;
  client?: Client;
  user_id?: string | number;
  created_by?: string | number;
  hall_id?: string | number;
  hall?: Hall;
  event_title?: string;
  event_details?: string;
  starttime?: string;
  endtime?: string;
  dueamount?: number | string;
  hall_name?: string;
  agent_code?: string;
  agent_user_code?: string;
  processing_date?: string;
}

interface Permission {
  id: number;
  name: string;
}

const StatusBookingsPage = () => {
  const params = useParams();
  const router = useRouter();
  const statusParam = (params.status as string) || "all";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [rateLimited, setRateLimited] = useState(false);
  
  // Use a Ref to lock the fetch process and prevent infinite loops
  const isFetching = useRef(false);

  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"approve" | "reject" | null>(null);

  // Memoize API to prevent re-triggering effects
  const api = useMemo(() => getApiClientInstance(), []);
  const authUser = useSelector((state: RootState) => state.auth.main.user);

  // --- Helpers ---

  const normalizeStatus = (s: string | null | undefined): string => 
    String(s || '').trim().toLowerCase();

  const isSuperAdmin = useMemo(() => {
    const role = normalizeStatus(authUser?.role?.name);
    return role === "super admin" || role === "superadmin";
  }, [authUser]);

  const isAgent = useMemo(() => 
    normalizeStatus(authUser?.role?.name).includes('agent'), 
  [authUser]);

  const hasBookingPermission = useCallback((permissionName: string): boolean => {
    if (isSuperAdmin) return true;
    return !!authUser?.permissions?.some((p: Permission) => {
      const pName = normalizeStatus(p?.name);
      return pName.includes(permissionName.toLowerCase()) || pName.includes("booking");
    });
  }, [isSuperAdmin, authUser?.permissions]);

  const canActionBooking = hasBookingPermission("approve") || hasBookingPermission("action");
  
  const hasPendingBookings = useMemo(() => 
    bookings.some(b => normalizeStatus(b.status) === "pending"), 
  [bookings]);

  const formatTimeTo12Hour = (datetime: string | null | undefined): string => {
    if (!datetime) return "—";
    try {
      const parseable = datetime.includes("-") ? datetime.replace(" ", "T") : `1970-01-01T${datetime}`;
      const date = new Date(parseable);
      return isNaN(date.getTime()) ? "—" : date.toLocaleTimeString('en-US', { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch { return "—"; }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toISOString().split('T')[0];
  };

  // --- Fetch Logic ---

  const fetchBookings = useCallback(async () => {
    if (isFetching.current) return; // Exit if already fetching

    try {
      isFetching.current = true;
      setRateLimited(false);
      setLoading(true);
      
      const res = await api.get("/bookings");
      const bookingsArray: Booking[] = res?.data?.data?.data || res?.data?.data || res?.data || [];

      let processed = bookingsArray.map((b: Booking) => ({
        ...b,
        hall_name: b.hall?.name || (b.hall_id ? `Hall #${b.hall_id}` : "N/A"),
      }));

      const requested = normalizeStatus(statusParam);
      
      if (requested !== "all") {
        processed = processed.filter(b => normalizeStatus(b.status) === requested);
      } else {
        const internalAllowed = ["pending", "processing", "paid", "approved", "confirmed"];
        processed = processed.filter(b => internalAllowed.includes(normalizeStatus(b.status)));
      }

      // RBAC Filtering
      if (!isSuperAdmin) {
        if (isAgent) {
          processed = processed.filter(b => b.agent_id == authUser?.agent?.id || b.agent_code === authUser?.agent_code);
        } else if (normalizeStatus(authUser?.role?.name).includes('client')) {
          processed = processed.filter(b => b.client_id == authUser?.client?.id || b.user_id === authUser?.id);
        }
      }

      // Sort with date safety
      setBookings(processed.sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
      }));
      
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err?.response?.status === 429) {
        setRateLimited(true);
        toast.error("Rate limit reached. Waiting for server...");
      } else {
        toast.error("Failed to load bookings");
      }
    } finally {
      setLoading(false);
      isFetching.current = false; // Release lock
    }
  }, [api, statusParam, isSuperAdmin, isAgent, authUser]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleBookingAction = async (bookingId: number, action: "approve" | "reject") => {
    if (!window.confirm(`Do you want to ${action} this booking?`)) return;

    setLoadingAction(action);
    try {
      const payload = {
        action: action === "approve" ? "Approved" : "Rejected",
        comment: `Booking ${action}ed by admin`,
      };
      const res = await api.patch(`/bookings/booking-action/${bookingId}`, payload);
      if (res.data.success) {
        toast.success(res.data.message || "Success ✅");
        setShowActionModal(false);
        fetchBookings();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Action failed ❌");
    } finally {
      setLoadingAction(null);
    }
  };

  const displayStatus = statusParam === "all" ? "All Status" : statusParam.charAt(0).toUpperCase() + statusParam.slice(1);

  if (loading && !rateLimited) return <Loading />;

  return (
    <section>
      <PageHeader title={`${displayStatus} Bookings`} description={`Viewing ${statusParam} bookings`}>
        <Button variant="outline-secondary" size="sm" onClick={() => router.push('/dashboard')}>← Back</Button>
      </PageHeader>

      <div className="mt-4">
        {rateLimited && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center">
            <span><strong>Server Busy:</strong> Please wait a minute before refreshing.</span>
            <Button size="sm" variant="danger" onClick={() => window.location.reload()}>Refresh</Button>
          </div>
        )}

        {bookings.length === 0 && !loading ? (
          <div className="text-center py-5">
            <h5>No bookings found</h5>
            <p className="text-muted">No records match the &quot;{statusParam}&quot; status.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Code</th>
                  <th>Event</th>
                  <th>Hall</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Amount</th>
                  {canActionBooking && hasPendingBookings && <th>Action</th>}
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, index) => {
                  const s = normalizeStatus(booking.status);
                  return (
                    <tr key={booking.id}>
                      <td>{index + 1}</td>
                      <td>{booking.code}</td>
                      <td>
                        <div className="fw-semibold">{booking.event_title || "N/A"}</div>
                        <small className="text-muted">{booking.event_details?.substring(0, 30)}...</small>
                      </td>
                      <td>{booking.hall_name}</td>
                      <td>{formatDate(booking.date)}</td>
                      <td>{formatTimeTo12Hour(booking.starttime)} - {formatTimeTo12Hour(booking.endtime)}</td>
                      <td>
                        <span className={`badge ${
                          (s === 'approved' || s === 'paid') ? 'bg-success' : 
                          (s === 'pending' || s === 'processing') ? 'bg-warning text-dark' : 'bg-secondary'
                        }`}>
                          {booking.status || "N/A"}
                        </span>
                      </td>
                      <td>₦{Number(booking.dueamount || 0).toLocaleString()}</td>
                      {canActionBooking && hasPendingBookings && (
                        <td>
                          {s === "pending" && (
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => { setActiveBooking(booking); setShowActionModal(true); }}>
                              Action
                            </button>
                          )}
                        </td>
                      )}
                      <td>
                        <Link href={`/booking/booking-list/details/${booking.id}`} className="btn btn-sm btn-outline-success">Details</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal show={showActionModal} onHide={() => setShowActionModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Booking Action</Modal.Title></Modal.Header>
        <Modal.Body>
          {activeBooking && (
            <div>
              <p><b>Code:</b> {activeBooking.code}</p>
              <p><b>Event:</b> {activeBooking.event_title}</p>
              <div className="d-flex gap-2 mt-3">
                <Button variant="success" onClick={() => handleBookingAction(activeBooking.id, "approve")} disabled={!!loadingAction}>
                  {loadingAction === "approve" ? <Spinner size="sm" /> : "Approve"}
                </Button>
                <Button variant="danger" onClick={() => handleBookingAction(activeBooking.id, "reject")} disabled={!!loadingAction}>
                  {loadingAction === "reject" ? <Spinner size="sm" /> : "Reject"}
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </section>
  );
};

export default StatusBookingsPage;