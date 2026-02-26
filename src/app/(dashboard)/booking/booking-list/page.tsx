"use client";

import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { PaginatedData, ApiResponse } from "./types";
import { FaRegEdit } from "react-icons/fa";
import Link from "next/link";
import { Spinner, Pagination } from "react-bootstrap";
import { toast } from "react-toastify";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import PageHeader from "../../components/page-header";
import Loading from "../../components/loading";
import PermissionGuard from "../../components/PermissionGuard";

interface HallBooking {
  id: number;
  code: string;
  schedule_id: number;
  number_of_seats: number;
  walkin_customer_name: string;
  walkin_customer_no: string;
  walkin_customer_email: string;
  dueamount: number | string;
  status?: string; 
  schedule?: {
    id: number;
    details: string;
    date: string;
    starttime: string;
    endtime: string;
    status: string;
  };
}

// payload used when editing a booking's walk-in customer details
interface EditBookingPayload {
  walkin_customer_name: string;
  walkin_customer_no: string;
  walkin_customer_email: string;
}

const BookingList = () => {
  const [bookings, setBookings] = useState<HallBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetch, setRefetch] = useState(false);
  // const [showFormModal, setShowFormModal] = useState(false);
  const [selectedBooking] = useState<HallBooking | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"approve" | "reject" | null>(null);
  const [actionComment, setActionComment] = useState<string>("");

  // editing state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<HallBooking | null>(null);
  const [editForm, setEditForm] = useState<EditBookingPayload>({
    walkin_customer_name: "",
    walkin_customer_no: "",
    walkin_customer_email: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);

  const isFetching = useRef(false);
  const api = useMemo(() => getApiClientInstance(), []);

  const fetchBookings = useCallback(async (page: number = 1) => {
    if (isFetching.current) return;
    try {
      isFetching.current = true;
      setLoading(true);
      const res = await api.get<ApiResponse<PaginatedData<HallBooking>>>(`/bookings/all-bookings?page=${page}`);
      if (res.data.success) {
        const rawList = Array.isArray(res.data.data) ? res.data.data : res.data.data?.data || [];
        setBookings(rawList);
        if (!Array.isArray(res.data.data) && res.data.data) {
          setTotalPages(res.data.data.last_page || 1);
          setTotalBookings(res.data.data.total || 0);
          setCurrentPage(res.data.data.current_page || page);
        }
      }
    } catch (err: unknown) {
      console.debug('Failed to fetch bookings:', err);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
      setRefetch(false);
      isFetching.current = false;
    }
  }, [api]);

  useEffect(() => {
    fetchBookings(currentPage);
  }, [fetchBookings, currentPage, refetch]);

  const handleBookingAction = async (id: number, action: "approve" | "reject") => {
    if (!window.confirm(`Confirm ${action}?`)) return;
    setLoadingAction(action);
    try {
      const payload = {
        action: action === "approve" ? "Approved" : "Rejected",
        comment: actionComment.trim() || `Booking ${action}ed`,
      };
      const res = await api.put(`/bookings/update-booking/${id}`, payload);
      if (res.data.success) {
        toast.success("Updated successfully ✅");
        setRefetch(true);
        setShowActionModal(false);
      }
    } catch (err: unknown) {
      console.debug('Update booking error:', err);
      toast.error("Update failed ❌");
    } finally {
      setLoadingAction(null);
    }
  };

  const formatTimeTo12Hour = (time?: string) => {
    if (!time) return "—";
    const date = new Date(time.replace(" ", "T"));
    return isNaN(date.getTime()) ? time : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <section>
      <PageHeader title="HALL BOOKINGS">
        <input
          type="search"
          className="form-control"
          placeholder="Search customer or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </PageHeader>

      {loading ? <Loading /> : (
        <>
          <div className="table-responsive mt-4">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>S/N</th>
                  <th>Customer Name</th>
                  <th>Booking Code</th>
                  <th>Date</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Amount</th>
                  <PermissionGuard permission="Edit Booking"><th className="text-center">Action</th></PermissionGuard>
                  <PermissionGuard permission="Show Booking"><th className="text-center">View</th></PermissionGuard>
                </tr>
              </thead>
              <tbody>
                {bookings
                  .filter(b => 
                    b.walkin_customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    b.code.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((b, i) => (
                  <tr key={b.id}>
                    <td>{i + 1}</td>
                    <td className="fw-semibold">{b.walkin_customer_name || "N/A"}</td>
                    <td className="text-primary fw-bold">{b.code}</td>
                    <td>{b.schedule?.date}</td>
                    <td className="small">{formatTimeTo12Hour(b.schedule?.starttime)}</td>
                    <td className="small">{formatTimeTo12Hour(b.schedule?.endtime)}</td>
                    <td>₦{Number(b.dueamount).toLocaleString()}</td>
                    <PermissionGuard permission="Edit Booking">
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
                          onClick={() => {
                            setEditingBooking(b);
                            setEditForm({
                              walkin_customer_name: b.walkin_customer_name || "",
                              walkin_customer_no: b.walkin_customer_no || "",
                              walkin_customer_email: b.walkin_customer_email || "",
                            });
                            setShowEditModal(true);
                          }}
                        >
                           <FaRegEdit />
                          Edit
                        </button>
                      </td>
                    </PermissionGuard>
                   <PermissionGuard permission="Show Booking">
                    <td className="text-center">
                      <Link 
                        href={`/booking/booking-list/details/${b.id}`} 
                        className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1 border-2"
                        style={{transition: 'all 0.2s ease'}}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#198754';
                          e.currentTarget.style.borderColor = '#198754';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.borderColor = '#198754';
                          e.currentTarget.style.color = '#198754';
                        }}
                      >
                       Detail
                      </Link>
                    </td>
                    </PermissionGuard>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4 mb-4">
              <small className="text-muted">
                Showing <strong>{(currentPage - 1) * 10 + 1}</strong> to <strong>{Math.min(currentPage * 10, totalBookings)}</strong> of <strong>{totalBookings}</strong> bookings
              </small>
              <Pagination className="mb-0">
                <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} />
                
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages)
                  .map((page, index, array) => {
                    const showEllipsis = index > 0 && array[index - 1] !== page - 1;
                    return (
                      <div key={page} className="d-flex">
                        {showEllipsis && <Pagination.Ellipsis disabled />}
                        <Pagination.Item active={page === currentPage} onClick={() => setCurrentPage(page)}>
                          {page}
                        </Pagination.Item>
                      </div>
                    );
                  })}
                
                <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} />
                <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Action Modal */}
      <Modal show={showActionModal} onHide={() => setShowActionModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Process Booking</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedBooking && (
            <>
              <p>Customer: <b>{selectedBooking.walkin_customer_name}</b></p>
              <Form.Group className="mb-3">
                <Form.Label>Note</Form.Label>
                <Form.Control as="textarea" value={actionComment} onChange={(e) => setActionComment(e.target.value)} />
              </Form.Group>
              <div className="d-flex gap-2">
                <button className="btn btn-success flex-grow-1" onClick={() => selectedBooking && handleBookingAction(selectedBooking.id, "approve")} disabled={!!loadingAction}>
                  {loadingAction === "approve" ? <Spinner size="sm" /> : "Approve"}
                </button>
                <button className="btn btn-danger flex-grow-1" onClick={() => selectedBooking && handleBookingAction(selectedBooking.id, "reject")} disabled={!!loadingAction}>
                  {loadingAction === "reject" ? <Spinner size="sm" /> : "Reject"}
                </button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Edit Booking Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingBooking && (
            <Form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const payload: EditBookingPayload = {
                    walkin_customer_name: editForm.walkin_customer_name,
                    walkin_customer_no: editForm.walkin_customer_no,
                    walkin_customer_email: editForm.walkin_customer_email,
                  };
                  const res = await api.put(`/bookings/update-booking/${editingBooking.id}`, payload);
                  if (res.data.success) {
                    toast.success("Booking updated successfully ✅");
                    setRefetch(true);
                    setShowEditModal(false);
                  } else {
                    toast.error(res.data.message || "Update failed");
                  }
                } catch (err: unknown) {
                  console.debug('Edit booking error:', err);
                  toast.error("Update failed ❌");
                }
              }}
            >
              <Form.Group className="mb-3">
                <Form.Label>Customer Name</Form.Label>
                <Form.Control
                  type="text"
                  value={editForm.walkin_customer_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, walkin_customer_name: e.target.value }))}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  type="text"
                  value={editForm.walkin_customer_no}
                  onChange={(e) => setEditForm((f) => ({ ...f, walkin_customer_no: e.target.value }))}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={editForm.walkin_customer_email}
                  onChange={(e) => setEditForm((f) => ({ ...f, walkin_customer_email: e.target.value }))}
                />
              </Form.Group>

              <div className="text-end">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </section>
  );
};

export default BookingList;

