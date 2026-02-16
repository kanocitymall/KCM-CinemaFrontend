"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { FiArrowLeft } from "react-icons/fi";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { formatTimeTo12Hour } from "@/app/utils";
import { toast } from "react-toastify";
import Modal from "react-bootstrap/Modal";

// 🔹 Define Interface to replace 'any'
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
}

const RangeBookingsPage = () => {
    const { id } = useParams();
    const router = useRouter();
    const hallId = id as string;

    const statuses = [
        "all",
        "pending",
        "approved",
        "processing",
        "paid",
        "completed",
        "canceled",
    ];

    const [rangeStart, setRangeStart] = useState<string>("");
    const [rangeEnd, setRangeEnd] = useState<string>("");
    const [rangeStatus, setRangeStatus] = useState<string>("All");
    const [rangePaginate, setRangePaginate] = useState<boolean>(true);
    const [rangeBookings, setRangeBookings] = useState<Booking[]>([]);
    const [loadingRange, setLoadingRange] = useState(false);
    const [page, setPage] = useState(1);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const pageSize = 10;

    const api = useMemo(() => getApiClientInstance(), []);

    const fetchRangeBookings = async () => {
        if (!hallId) return;
        if (!rangeStart || !rangeEnd) {
            toast.error("Please select both start and end dates.");
            return;
        }

        try {
            setLoadingRange(true);
            const params: Record<string, string | boolean> = {
                start_date: rangeStart,
                end_date: rangeEnd,
                paginate: rangePaginate,
            };
            if (rangeStatus && rangeStatus !== "All") params.status = rangeStatus;

            const res = await api.get(`/bookings/hall-range-bookings/${hallId}`, { params });
            const data = res?.data?.data;
            
            let arr: Booking[] = [];
            if (Array.isArray(data?.data)) arr = data.data;
            else if (Array.isArray(data)) arr = data;
            else if (Array.isArray(res?.data)) arr = res.data;
            
            setRangeBookings(arr);
            setPage(1); 
            setShowFilterModal(false);
        } catch (err: unknown) {
            console.error("Range bookings fetch error:", err);
            const errorMessage = "Failed to fetch range bookings";
            toast.error(errorMessage);
            setRangeBookings([]);
        } finally {
            setLoadingRange(false);
        }
    };

    const printRangeBookings = () => {
        if (!rangeBookings || rangeBookings.length === 0) {
            toast.info("No bookings to print.");
            return;
        }
        const win = window.open("", "_blank");
        if (!win) {
            alert("Unable to open print window.");
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
        const tableRows = rangeBookings.map(b => `
            <tr>
                <td>${b.code}</td>
                <td>${b.title}</td>
                <td>${b.date}</td>
                <td>${formatTimeTo12Hour(b.starttime)}${b.endtime ? ` - ${formatTimeTo12Hour(b.endtime)}` : ''}</td>
                <td>${b.dueamount ? `₦${Number(b.dueamount).toLocaleString()}` : '₦0'}</td>
                <td>${b.status}</td>
            </tr>
        `).join('');
        
        const content = `
            ${styles}
            <h2>Range Bookings Report</h2>
            <p><strong>Hall ID:</strong> ${hallId}</p>
            <p><strong>Date Range:</strong> ${rangeStart} to ${rangeEnd}</p>
            <p><strong>Status:</strong> ${rangeStatus}</p>
            <table>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Title</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Amount Due</th>
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

    const visibleBookings = rangeBookings.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="min-vh-100 p-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center gap-3">
                    <button className="btn btn-light btn-sm" onClick={() => router.push(`/hall/hall-list/details/${hallId}`)}>
                        <FiArrowLeft />
                    </button>
                    <div>
                        <h3 className="mb-0">Range Bookings</h3>
                        <small className="text-muted">
                            {rangeBookings.length > 0 && (
                                <>Range: {rangeStart} to {rangeEnd} | Status: {rangeStatus}</>
                            )}
                        </small>
                    </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <Button variant="outline-primary" size="sm" onClick={() => setShowFilterModal(true)}>
                        {rangeBookings.length > 0 ? 'Change Filters' : 'Filter Range'}
                    </Button>
                    {rangeBookings.length > 0 && (
                        <>
                            <Button variant="outline-secondary" size="sm" onClick={() => {
                                setRangeBookings([]);
                                setRangeStart("");
                                setRangeEnd("");
                                setRangeStatus("All");
                                setPage(1);
                                setShowFilterModal(true);
                            }}>
                                New Search
                            </Button>
                            <Button variant="success" size="sm" onClick={printRangeBookings}>
                                Print Report
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <Modal show={showFilterModal} onHide={() => setShowFilterModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Select Date Range & Status</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="row g-3">
                        <div className="col-12">
                            <Form.Group>
                                <Form.Label>Status</Form.Label>
                                <Form.Select value={rangeStatus} onChange={(e) => setRangeStatus(e.target.value)}>
                                    {statuses.map((status) => (
                                        <option key={status} value={status.charAt(0).toUpperCase() + status.slice(1)}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label>End Date</Form.Label>
                                <Form.Control type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
                            </Form.Group>
                        </div>
                        <div className="col-12">
                            <Form.Check
                                type="checkbox"
                                checked={rangePaginate}
                                onChange={(e) => setRangePaginate(e.target.checked)}
                                label="Enable pagination"
                            />
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowFilterModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={fetchRangeBookings}
                        disabled={loadingRange || !rangeStart || !rangeEnd}
                    >
                        {loadingRange ? "Loading..." : "Fetch Bookings"}
                    </Button>
                </Modal.Footer>
            </Modal>

            <div className="card shadow-sm border-0">
                <div className="card-body">
                    {loadingRange ? (
                        <div className="text-center py-5">
                            <p>Loading bookings...</p>
                        </div>
                    ) : rangeBookings.length === 0 ? (
                        <div className="text-center text-muted py-5">No bookings to display for the selected range.</div>
                    ) : (
                        <div className="row g-3">
                            {visibleBookings.map((b) => (
                                <div key={b.id} className="col-12">
                                    <div className="d-flex gap-3 p-3 rounded-3" style={{ background: '#fff', border: '1px solid #eef2f6' }}>
                                        <div style={{ width: 64, height: 64, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                                            {(b.code || '').slice(0,2).toUpperCase()}
                                        </div>
                                        <div className="flex-fill">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <div className="fw-bold">{b.title || b.code}</div>
                                                    <div className="text-muted small">Hall ID: {hallId} · {b.date} · {formatTimeTo12Hour(b.starttime)}{b.endtime ? ` - ${formatTimeTo12Hour(b.endtime)}` : ''}</div>
                                                </div>
                                                <div className="text-end">
                                                    <div><span className={`badge rounded-pill ${['paid', 'completed'].includes(String(b.status).toLowerCase()) ? 'bg-success' : String(b.status).toLowerCase() === 'pending' ? 'bg-warning text-dark' : 'bg-secondary'}`}>{b.status}</span></div>
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
                    <div className="text-muted small">Showing {(page-1)*pageSize+1} - {Math.min(page*pageSize, rangeBookings.length)} of {rangeBookings.length}</div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-light" disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))}>Previous</button>
                        <div className="px-2 align-self-center">Page {page}</div>
                        <button className="btn btn-sm btn-light" disabled={page*pageSize >= rangeBookings.length} onClick={() => setPage(p => p+1)}>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RangeBookingsPage;