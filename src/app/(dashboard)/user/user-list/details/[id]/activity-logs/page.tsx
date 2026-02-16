"use client";

import { useState, useMemo } from "react"; // Removed unused useEffect
import { useParams, useRouter } from "next/navigation";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { FiArrowLeft } from "react-icons/fi";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { toast } from "react-toastify";
import Modal from "react-bootstrap/Modal";

interface ActivityLog {
  id: number;
  activity: string;
  more_details: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    phoneNo: string;
    address: string;
    email: string;
    email_verified_at: string | null;
    role_id: number;
    state_id: number;
    status: number;
    created_at: string;
    updated_at: string;
  };
}

// ✅ Added interface for API parameters
interface ActivityLogParams {
  user_id: number;
  start_date: string;
  end_date: string;
}

// ✅ Added interface for API Errors
interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const UserActivityLogsPage = () => {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ✅ Memoized api to maintain stability
  const api = useMemo(() => getApiClientInstance(), []);

  const fetchActivityLogs = async (start?: string, end?: string) => {
    if (!userId) return;
    if (!start || !end) {
      toast.error("Please select both start and end dates.");
      return;
    }

    try {
      setLoading(true);
      // ✅ Fixed: Replaced 'any' with explicit type
      const queryParams: ActivityLogParams = {
        user_id: parseInt(userId),
        start_date: start,
        end_date: end,
      };

      const res = await api.get(`/users/user-range-activity-logs`, { params: queryParams });
      const data = res?.data?.data;
      
      let arr: ActivityLog[] = [];
      if (Array.isArray(data?.data)) arr = data.data;
      else if (Array.isArray(data)) arr = data;
      else if (Array.isArray(res?.data)) arr = res.data;
      
      setActivityLogs(arr);
      setPage(1);
      setShowFilterModal(false);
    } catch (err: unknown) { // ✅ Fixed: Changed 'any' to 'unknown'
      const apiErr = err as ApiError;
      console.error("Activity logs fetch error details:", {
        message: apiErr.message,
        status: apiErr.response?.status,
        data: apiErr.response?.data
      });
      
      const errorMessage = apiErr.response?.data?.message || apiErr.message || "Failed to fetch activity logs";
      console.error("Display Error:", errorMessage);
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const printActivityLogs = () => {
    if (!activityLogs || activityLogs.length === 0) {
      toast.info("No activity logs to print.");
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
    const tableRows = activityLogs.map(log => `
      <tr>
        <td>${log.user?.name || 'Unknown'} (${log.user?.email || ''})</td>
        <td>${new Date(log.created_at).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })}</td>
        <td>${log.activity.toUpperCase()}</td>
      </tr>
    `).join('');
    
    const content = `
      ${styles}
      <h2>User Activity Logs Report</h2>
      <p><strong>User ID:</strong> ${userId}</p>
      <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Date & Time</th>
            <th>Activity</th>
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

  const visibleLogs = activityLogs.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-vh-100 p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-light btn-sm" onClick={() => router.push(`/user/user-list/details/${userId}`)}>
            <FiArrowLeft />
          </button>
          <div>
            <h3 className="mb-0">User Activity Logs</h3>
            <small className="text-muted">
              {activityLogs.length > 0 && (
                <>Period: From {startDate} to {endDate}</>
              )}
            </small>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button variant="outline-primary" size="sm" onClick={() => setShowFilterModal(true)}>
            {activityLogs.length > 0 ? 'Change Period' : 'Select Period'}
          </Button>
          {activityLogs.length > 0 && (
            <>
              <Button variant="outline-secondary" size="sm" onClick={() => {
                setActivityLogs([]);
                setStartDate("");
                setEndDate("");
                setPage(1);
                setShowFilterModal(true);
              }}>
                New Search
              </Button>
              <Button variant="success" size="sm" onClick={printActivityLogs}>
                Print Report
              </Button>
            </>
          )}
        </div>
      </div>

      <Modal show={showFilterModal} onHide={() => setShowFilterModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Select Date Range</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Form.Group>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFilterModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => fetchActivityLogs(startDate, endDate)}
            disabled={loading || !startDate || !endDate}
          >
            {loading ? "Loading..." : "Fetch Activity Logs"}
          </Button>
        </Modal.Footer>
      </Modal>

      <div className="card shadow-sm border-0">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <p>Loading activity logs...</p>
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="text-center text-muted py-5">
              {startDate && endDate
                ? "No activity logs found from front end"
                : "Select a date range to view activity logs."
              }
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '30%' }}>User</th>
                    <th style={{ width: '35%' }}>Date & Time</th>
                    <th style={{ width: '35%' }}>Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div style={{ fontSize: '0.875rem' }}>
                          <div className="fw-bold">{log.user?.name || 'Unknown'}</div>
                          <div className="text-muted small">{log.user?.email || ''}</div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                        {new Date(log.created_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td>
                        <span className="badge bg-primary text-uppercase" style={{ fontSize: '0.75rem' }}>
                          {log.activity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {activityLogs.length > 0 && (
          <div className="card-footer d-flex justify-content-between align-items-center">
            <div className="text-muted small">
              Showing {(page-1)*pageSize+1} - {Math.min(page*pageSize, activityLogs.length)} of {activityLogs.length}
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-light"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p-1))}
              >
                Previous
              </button>
              <div className="px-2 align-self-center">Page {page}</div>
              <button
                className="btn btn-sm btn-light"
                disabled={page * pageSize >= activityLogs.length}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserActivityLogsPage;