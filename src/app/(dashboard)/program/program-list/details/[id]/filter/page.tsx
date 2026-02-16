"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Spinner, Table, Row, Col, Form } from "react-bootstrap";
import { BsArrowLeft } from "react-icons/bs";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { toast } from "react-toastify";
import type { FilterResult } from "../../types";

export default function FilterPage() {
  console.log({
    "success": false,
    "message": "No reviews found for the specified criteria.",
    "data": 404
  });

  const { id } = useParams();
  const router = useRouter();
  const api = useMemo(() => getApiClientInstance(), []);

  // --- Filter & View state ---
  const [viewMode, setViewMode] = useState<'range'|'schedules'>('range');
  const [statusFilter, setStatusFilter] = useState<'All'|'Scheduled'|'Cancelled'|'Completed'>('All');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');
  const [paginate, _setPaginate] = useState<boolean>(true);
  // Keep the setter for future use; mark as intentionally unused to silence lint
  void _setPaginate;
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterResults, setFilterResults] = useState<FilterResult[]>([]);

  // Helper: convert month picker (YYYY-MM) to full date string (YYYY-MM-01) expected by API
  const formatDateParam = (d: string) => {
    if (!d) return d;
    if (/^\d{4}-\d{2}$/.test(d)) return `${d}-01`;
    return d;
  };

  const formatEndDateParam = (d: string) => {
    if (!d) return d;
    if (/^\d{4}-\d{2}$/.test(d)) {
      const [y, m] = d.split('-');
      const year = parseInt(y, 10);
      const month = parseInt(m, 10);
      const lastDay = new Date(year, month, 0).getDate();
      return `${y}-${m.padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    }
    return d;
  };

  // Display helper: converts YYYY-MM-DD or YYYY-MM into D/M/YYYY for UI
  const formatDisplayDMY = (d?: string) => {
    if (!d) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [y, m, day] = d.split('-');
      return `${parseInt(day, 10)}/${parseInt(m, 10)}/${y}`;
    }
    if (/^\d{4}-\d{2}$/.test(d)) {
      const [y, m] = d.split('-');
      return `1/${parseInt(m, 10)}/${y}`;
    }
    return d;
  };

  const fetchRangeReviews = async () => {
    if (!id) return;
    try {
      setFilterLoading(true);
      const params: Record<string, string> = {};
      if (rangeStart) params.start_date = formatDateParam(rangeStart);
      if (rangeEnd) params.end_date = formatEndDateParam(rangeEnd);
      params.paginate = paginate ? 'true' : 'false';
      const res = await api.get(`/programs/range-reviews/${id}`, { params });
      const data = res.data?.data ?? res.data ?? [];
      setFilterResults(Array.isArray(data) ? data : [data]);
    } catch (error: unknown) {
      console.warn('range-reviews failed', error);
      toast.error('Failed to load range reviews');
    } finally {
      setFilterLoading(false);
    }
  };

  const fetchByStatus = async (status: string) => {
    if (!id) return;
    try {
      setFilterLoading(true);
      const params: Record<string, string> = { paginate: paginate ? 'true' : 'false' };
      if (status && status !== 'All') params.status = status;
      const res = await api.get(`/programs/program-range-schedules-by-status/${id}`, { params });
      const data = res.data?.data ?? res.data ?? [];
      setFilterResults(Array.isArray(data) ? data : [data]);
    } catch (error: unknown) {
      console.warn('status endpoint failed', error);
      toast.error('Failed to load by-status results');
      setFilterResults([]);
    } finally {
      setFilterLoading(false);
    }
  };

  const fetchByDate = async (dateStr: string) => {
    if (!id) return;
    try {
      setFilterLoading(true);
      const formatted = formatDateParam(dateStr);
      const res = await api.get(`/programs/program-schedules-by-date/${id}`, { params: { date: formatted, paginate: paginate ? 'true' : 'false' } });
      const data = res.data?.data ?? res.data ?? [];
      setFilterResults(Array.isArray(data) ? data : [data]);
    } catch (error: unknown) {
      console.warn('by-date endpoint failed', error);
      toast.error('Failed to load schedules for selected date');
      setFilterResults([]);
    } finally {
      setFilterLoading(false);
    }
  };

  // Central fetcher that decides which endpoint to call
  const fetchFilteredData = async () => {
    if (viewMode === 'range') {
      await fetchRangeReviews();
      return;
    }

    // viewMode === 'schedules'
    if (dateFilter) {
      await fetchByDate(dateFilter);
      return;
    }

    if (statusFilter && statusFilter !== 'All') {
      await fetchByStatus(statusFilter);
      return;
    }

    // Default to range reviews when no specific filter selected
    await fetchRangeReviews();
  };

  return (
    <div className="container-fluid py-4">
      <div className="mx-auto" style={{ maxWidth: "900px" }}>
        
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Button 
            variant="white" 
            className="btn-sm border shadow-sm d-flex align-items-center gap-2 px-3" 
            onClick={() => router.back()}
          >
            <BsArrowLeft /> Back
          </Button>
          <h3 className="mb-0 fw-bold">Filter / Select Type</h3>
          <div style={{ width: '100px' }}></div>
        </div>

        {/* Filter Card */}
        <Card className="shadow-sm border-0 mb-5">
          <Card.Header className="bg-white py-3 border-bottom d-flex align-items-center gap-2">
            <h5 className="mb-0 fw-bold">Filter Options</h5>
          </Card.Header>
          <Card.Body>
            <Row className="align-items-center gy-2 mb-3">
              <Col xs={12} md={6} className="d-flex gap-2">
                <div className="btn-group" role="group">
                  <Button variant={viewMode === 'range' ? 'primary' : 'outline-primary'} onClick={() => setViewMode('range')}>Range Reviews</Button>
                  <Button variant={viewMode === 'schedules' ? 'primary' : 'outline-primary'} onClick={() => setViewMode('schedules')}>Schedules</Button>
                </div>
              </Col>

              {viewMode === 'schedules' ? (
                <>
                  <Col xs={12} md={3}>
                    <Form.Label className="small text-muted mb-1">Status</Form.Label>
                    <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'All'|'Scheduled'|'Cancelled'|'Completed')}>
                      <option value="All">All</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Completed">Completed</option>
                    </Form.Select>
                  </Col>

                  <Col xs={12} md={3}>
                    <Form.Label className="small text-muted mb-1"><span className="text-muted small"></span></Form.Label>
                    <Form.Control type="month" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                    <Form.Text className="text-muted small">{"{program_id}"}</Form.Text>
                  </Col>
                </>
              ) : (
                <>
                  <Col xs={12} md={3}>
                    <Form.Label className="small text-muted mb-1">Start Date <span className="text-muted small"></span></Form.Label>
                    <Form.Control type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
                    {rangeStart && <Form.Text className="text-muted small"> {formatDisplayDMY(rangeStart)}</Form.Text>}
                  </Col>

                  <Col xs={12} md={3}>
                    <Form.Label className="small text-muted mb-1">End Date <span className="text-muted small"></span></Form.Label>
                    <Form.Control type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
                    {rangeEnd && <Form.Text className="text-muted small">{formatDisplayDMY(rangeEnd)}</Form.Text>}
                    {/* <Form.Text className="text-muted small">{"{program_id}"}</Form.Text> */}
                  </Col>
                </>
              )}
            </Row>

            <div className="mb-3 d-flex gap-2">
              <Button variant="primary" onClick={async () => {
                if (viewMode === 'range') {
                  if (!rangeStart || !rangeEnd) {
                    toast.warning('Please select both start and end dates before applying.');
                    return;
                  }
                  const start = new Date(formatDateParam(rangeStart));
                  const end = new Date(formatEndDateParam(rangeEnd));
                  if (start.getTime() > end.getTime()) {
                    toast.warning('End date must be the same or after the start date.');
                    return;
                  }
                }
                await fetchFilteredData();
              }}>
                Apply
              </Button>
              <Button variant="outline-secondary" onClick={() => { setStatusFilter('All'); setDateFilter(''); setRangeStart(''); setRangeEnd(''); setViewMode('range'); setFilterResults([]); }}>
                Clear
              </Button>
            </div>

            {/* Results */}
            <div className="mt-4">
              <h6 className="fw-bold mb-3">Results</h6>
              {filterLoading ? (
                <div className="text-center py-3"><Spinner animation="border" variant="primary" /></div>
              ) : filterResults.length === 0 ? (
                <div className="alert alert-info">No results for the selected filters.</div>
              ) : (
                <Table responsive bordered>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Date / Info</th>
                      <th>Start / End</th>
                      <th>Hall</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterResults.map((r) => {
                      // Generic safe accessor for loosely-shaped response objects
                      const getField = (keys: string[]) => {
                        for (const k of keys) {
                          const v = (r as Record<string, unknown>)[k];
                          if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
                        }
                        return '—';
                      };

                      const id = getField(['id']);
                      const dateInfo = getField(['date', 'time', 'label', 'title']);
                      const startEnd = `${getField(['starttime', 'start_time', 'time'])} / ${getField(['endtime', 'end_time'])}`;
                      const hall = getField(['hall', 'hall_name', 'hallName']) || ((r as Record<string, unknown>).hall && typeof (r as Record<string, unknown>).hall === 'object' ? String(((r as Record<string, unknown>).hall as Record<string, unknown>).name || '') : '—');
                      const status = getField(['status', 'state']);

                      return (
                      <tr key={id || JSON.stringify(r)}>
                        <td>{id || '—'}</td>
                        <td>{dateInfo || '—'}</td>
                        <td>{startEnd}</td>
                        <td>{hall || '—'}</td>
                        <td>{status || '—'}</td>
                      </tr>
                    )})}
                  </tbody>
                </Table>
              )}
            </div>
          </Card.Body>
        </Card>

      </div>
    </div>
  );
}
