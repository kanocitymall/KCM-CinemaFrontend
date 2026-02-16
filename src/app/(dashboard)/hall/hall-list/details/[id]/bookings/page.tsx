"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { formatTimeTo12Hour } from "@/app/utils";
import { toast } from "react-toastify";
import Modal from "react-bootstrap/Modal";

const pageSize = 10;

// 🔹 Define Booking Interface to replace 'any'
interface Booking {
  id: number;
  code: string;
  title: string;
  date: string;
  starttime: string;
  endtime?: string;
  amountpaid?: number | string;
  dueamount?: number | string;
  status: string;
  hall?: {
    name: string;
  };
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const statusOptions = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "processing", label: "Processing" },
  { value: "paid", label: "Paid" },
  { value: "completed", label: "Completed" },
  { value: "canceled", label: "Canceled" },
];

export default function HallBookingsPage() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const hallId = params?.id;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentFilters, setCurrentFilters] = useState({ status: "", startDate: "", endDate: "" });

  const rawStatus = (search?.get("status") || "");
  const statusParam = String(rawStatus).trim();

  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

  const api = useMemo(() => getApiClientInstance(), []);

  const getFilterDisplay = () => {
    const filters = [];
    if (currentFilters.status) {
      const statusLabel = statusOptions.find(opt => opt.value === currentFilters.status)?.label || currentFilters.status;
      filters.push(`Status: ${statusLabel}`);
    }
    if (currentFilters.startDate) filters.push(`From: ${currentFilters.startDate}`);
    if (currentFilters.endDate) filters.push(`To: ${currentFilters.endDate}`);
    return filters.length > 0 ? filters.join(', ') : 'All bookings';
  };

  const fetchBookings = useCallback(async (status?: string, start?: string, end?: string) => {
    if (!hallId) return;
    setLoading(true);
    setError(null);
    try {
      const queryParams: Record<string, string | boolean> = { paginate: false };
      if (status) queryParams.status = capitalize(status);
      if (start) queryParams.start_date = start;
      if (end) queryParams.end_date = end;
      
      const res = await api.get(`/bookings/hall-bookings/${hallId}`, { params: queryParams });
      const data = res?.data?.data;
      
      let arr: Booking[] = [];
      if (Array.isArray(data?.data)) arr = data.data;
      else if (Array.isArray(data)) arr = data;
      else if (Array.isArray(res?.data)) arr = res.data;
      
      setBookings(arr);
    } catch (e: unknown) {
      const err = e as ApiError;
      console.error("Failed to fetch hall bookings:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to load bookings";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [api, hallId]);

  const printBookings = () => {
    if (!bookings || bookings.length === 0) {
      toast.info("No bookings to print.");
      return;
    }
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Unable to open print window.");
      return;
    }
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        h2 { text-align: center; }
      </style>
    `;
    const tableRows = bookings.map(b => `
      <tr>
        <td>${b.code}</td>
        <td>${b.title}</td>
        <td>${b.date}</td>
        <td>${formatTimeTo12Hour(b.starttime)}${b.endtime ? ` - ${formatTimeTo12Hour(b.endtime)}` : ''}</td>
        <td>${b.amountpaid ? `₦${Number(b.amountpaid).toLocaleString()}` : b.dueamount ? `₦${Number(b.dueamount).toLocaleString()}` : ''}</td>
        <td>${b.status}</td>
      </tr>
    `).join('');
    
    const content = `
      ${styles}
      <h2>Hall Bookings Report</h2>
      <p><strong>Hall ID:</strong> ${hallId}</p>
      <p><strong>Status:</strong> ${statusParam || 'All'}</p>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Title</th>
            <th>Date</th>
            <th>Time</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
    win.document.write(content);
    win.document.close();
    win.print();
  };

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const visible = bookings.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-vh-100 p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-light btn-sm" onClick={() => router.push(`/hall/hall-list/details/${hallId}`)}>
            <FiArrowLeft />
          </button>
          <div>
            <h3 className="mb-0">Hall Bookings</h3>
            <small className="text-muted">Filter: {getFilterDisplay()}</small>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => setShowFilterModal(true)}
          >
            Filter
          </button>
          {(currentFilters.status || currentFilters.startDate || currentFilters.endDate) && (
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                setSelectedStatus("");
                setStartDate("");
                setEndDate("");
                setCurrentFilters({ status: "", startDate: "", endDate: "" });
                setPage(1);
                fetchBookings();
              }}
            >
              Clear Filters
            </button>
          )}
          {bookings.length > 0 && (
            <button className="btn btn-success btn-sm" onClick={printBookings}>
              Print Report
            </button>
          )}
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
          ) : error ? (
            <div className="text-center text-danger py-5">{error}</div>
          ) : bookings.length === 0 ? (
            <div className="text-center text-muted py-5">No bookings found for this filter.</div>
          ) : (
            <div className="row g-3">
              {visible.map((b) => (
                <div key={b.id} className="col-12">
                  <div className="d-flex gap-3 p-3 rounded-3" style={{ background: '#fff', border: '1px solid #eef2f6' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                      {(b.code || '').slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-fill">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-bold">{b.title || b.code}</div>
                          <div className="text-muted small">{b.hall?.name ?? ''} · {b.date} · {formatTimeTo12Hour(b.starttime)}{b.endtime ? ` - ${formatTimeTo12Hour(b.endtime)}` : ''}</div>
                        </div>
                        <div className="text-end">
                          <div><span className={`badge rounded-pill ${String(b.status||'').toLowerCase() === 'paid' ? 'bg-success' : 'bg-secondary'}`}>{b.status}</span></div>
                          <div className="mt-2 fw-semibold">{b.amountpaid ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(b.amountpaid)) : b.dueamount ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(b.dueamount)) : ''}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card-footer d-flex justify-content-between align-items-center">
          <div className="text-muted small">Showing {(page-1)*pageSize+1} - {Math.min(page*pageSize, bookings.length)} of {bookings.length}</div>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-light" disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))}>Previous</button>
            <div className="px-2 align-self-center">Page {page}</div>
            <button className="btn btn-sm btn-light" disabled={page*pageSize >= bookings.length} onClick={() => setPage(p => p+1)}>Next</button>
          </div>
        </div>
      </div>

      <Modal show={showFilterModal} onHide={() => setShowFilterModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Filter Bookings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="statusSelect" className="form-label">Status</label>
            <select
              className="form-select"
              id="statusSelect"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="startDate" className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="endDate" className="form-label">End Date</label>
            <input
              type="date"
              className="form-control"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={() => setShowFilterModal(false)}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setPage(1);
              fetchBookings(selectedStatus, startDate, endDate);
              setCurrentFilters({ status: selectedStatus, startDate, endDate });
              setShowFilterModal(false);
            }}
          >
            Apply Filter
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}