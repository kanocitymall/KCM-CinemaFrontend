"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Table } from "react-bootstrap";
import PageHeader from "../../components/page-header";
import Loading from "../../components/loading";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { toast } from "react-toastify";
import {
  ActivityLog,
  PaginatedData,
  SimpleApiResponse,
} from "./types";
import PermissionGuard from "../../components/PermissionGuard";

const ActivityLogsPage = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginatedData<ActivityLog> | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFrom, setReportFrom] = useState<string>("");
  const [reportTo, setReportTo] = useState<string>("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // 1. Memoize the API client so it doesn't trigger re-renders
  const api = useMemo(() => getApiClientInstance(), []);

  // 2. Wrap loadData in useCallback to fix the dependency warning
  const loadData = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await api.get<SimpleApiResponse<PaginatedData<ActivityLog>>>(
        `/users/activity-logs?page=${page}`
      );

      if (res.data.success) {
        setLogs(res.data.data.data);
        setPagination(res.data.data);
      } else {
        console.error("Failed to load activity logs");
        setLogs([]);
        setPagination(null);
      }
    } catch (err) {
      console.error("Error loading activity logs:", err);
      setLogs([]);
      setPagination(null);
      toast.error("Error loading activity logs");
    } finally {
      setLoading(false);
    }
  }, [api]); // Only recreates if api instance changes

  // 3. Include loadData in the dependency array safely
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePageChange = (url: string | null) => {
    if (url) {
      const urlObj = new URL(url);
      const page = urlObj.searchParams.get("page");
      if (page) {
        loadData(parseInt(page));
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // open modal from header button; actual generation below
  const handleGenerateReport = async () => {
    // basic validation
    if (!reportFrom || !reportTo) return toast.error("Please select both dates");
    if (new Date(reportFrom) > new Date(reportTo)) return toast.error("From date cannot be after To date");

    setIsGeneratingReport(true);
    try {
      const res = await api.get<SimpleApiResponse<PaginatedData<ActivityLog>>>(`/users/activity-logs`, {
        params: { paginate: false, download: false }
      });

      if (!res.data.success) {
        toast.error(res.data.message || "Failed to fetch activity logs for report");
        return;
      }

      const allLogs: ActivityLog[] = (res.data.data && (res.data.data.data as ActivityLog[])) || [];
      const from = new Date(reportFrom);
      const to = new Date(reportTo);

      const filtered = allLogs.filter((log) => {
        const d = new Date(log.created_at);
        return d >= from && d <= to;
      });

      if (filtered.length === 0) {
        toast.info("No activity logs found for the selected range");
        setShowReportModal(false);
        return;
      }

      // Build printable HTML
      const title = `Activity Logs Report (${from.toLocaleDateString()} - ${to.toLocaleDateString()})`;
      const style = `
        <style>
          body{font-family: Arial, Helvetica, sans-serif; padding:20px}
          table{width:100%;border-collapse:collapse}
          th,td{border:1px solid #ccc;padding:8px;text-align:left}
          th{background:#f5f5f5}
        </style>
      `;

      const rows = filtered.map(l => `
        <tr>
          <td>${String(l.id)}</td>
          <td>${escapeHtml(String(l.activity))}</td>
          <td>${escapeHtml(String(l.more_details || "-"))}</td>
          <td>${escapeHtml(String(l.user?.name || '-'))}</td>
          <td>${escapeHtml(formatDate(l.created_at))}</td>
        </tr>
      `).join("");

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>${style}</head><body><h2>${escapeHtml(title)}</h2><table><thead><tr><th>ID</th><th>Activity</th><th>More Details</th><th>User</th><th>Created At</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;

      const w = window.open("", "_blank");
      if (!w) {
        toast.error("Unable to open print window");
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      // wait for content to render
      setTimeout(() => {
        w.focus();
        w.print();
      }, 500);

      setShowReportModal(false);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to generate report");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // small helper to escape HTML
  function escapeHtml(str: string) {
    return str.replace(/[&<>"'`]/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '`': '&#96;'
    } as Record<string,string>)[c]);
  }

  return (
    <section>
      <PageHeader title="Activity Logs">
        <PermissionGuard permission="View Range Activity Logs">
          <button
            className="btn btn-success d-flex align-items-center gap-2 text-nowrap"
            onClick={() => setShowReportModal(true)}
          >
            Generate Report
          </button>
        </PermissionGuard>
      </PageHeader>

      {/* Date range modal */}
      <div className={`modal fade ${showReportModal ? 'show d-block' : ''}`} tabIndex={-1} role="dialog" aria-hidden={!showReportModal}>
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Generate Activity Logs Report</h5>
              <button type="button" className="btn-close" onClick={() => setShowReportModal(false)} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">From</label>
                <input type="date" className="form-control" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label">To</label>
                <input type="date" className="form-control" value={reportTo} onChange={(e) => setReportTo(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowReportModal(false)}>Cancel</button>
              <button type="button" className="btn btn-success" onClick={handleGenerateReport} disabled={isGeneratingReport}>{isGeneratingReport ? 'Generating...' : 'Generate'}</button>
            </div>
          </div>
        </div>
      </div>
      {loading ? (
        <Loading />
      ) : (
        <section className="pt-4">
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Activity</th>
                      <th>More Details</th>
                      <th>User</th>
                      <th>Date and Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td>{log.activity}</td>
                        <td>{log.more_details || "-"}</td>
                        <td>{log.user.name}</td>
                        <td>{formatDate(log.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {pagination && (
                <nav aria-label="Activity logs pagination">
                  <ul className="pagination justify-content-center">
                    {pagination.links.map((link, index) => (
                      <li
                        key={index}
                        className={`page-item ${link.active ? "active" : ""} ${
                          !link.url ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(link.url)}
                          disabled={!link.url}
                        >
                          <span dangerouslySetInnerHTML={{ __html: link.label }} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </section>
      )}
    </section>
  );
};

export default ActivityLogsPage;