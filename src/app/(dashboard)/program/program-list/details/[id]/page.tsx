"use client";

import Image from "next/image";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Button, Spinner, Dropdown, Table, Badge, Row, Col, Modal, Form } from "react-bootstrap";
import { BsArrowLeft, BsTrash, BsThreeDotsVertical, BsCloudUpload, BsInfoCircle, BsImage, BsX } from "react-icons/bs";
import { MdEventSeat } from "react-icons/md";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { mockSchedules } from "@/app/utils/api-mock";
import { toast } from "react-toastify";
import ScheduleForm from "../../../../schedule/schedule-list/components/schedule-form";
import type { FilterResult } from "../types";
import PermissionGuard from "../../../../components/PermissionGuard";

// Resolved 'any' error by defining specific interface
interface ProgramImage {
  id: number;
  image_path: string;
  imageable_type?: string;
  imageable_id?: number;
  created_at?: string;
  updated_at?: string;
}

interface Program {
  id: number;
  title: string;
  description: string;
  duration: string;
  status: number;
  created_at: string;
  program_type?: { name: string };
  images?: ProgramImage[]; // Replaced any[]
}

interface Schedule {
  id: number;
  program_id?: number;
  program?: { id?: number; title?: string } | null;
  title?: string;
  date?: string;
  datetime?: string;
  date_time?: string;
  starttime?: string;
  time?: string;
  start_time?: string;
  time_slot?: string;
  endtime?: string;
  end_time?: string;
  time_end?: string;
  hall?: { id?: number; name?: string } | null;
  hall_name?: string;
  hallName?: string;
  hall_id?: number;
}

export default function ProgramDetailsPage() { 
  console.log({
    "success": false,
    "message": "No reviews found for the specified criteria.",
    "data": 404
  });
  
  const { id } = useParams();
  const router = useRouter();
  const api = useMemo(() => getApiClientInstance(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedImg, setSelectedImg] = useState("");
  const [showCreateScheduleModal, setShowCreateScheduleModal] = useState(false);
  const [showSelectScheduleModal, setShowSelectScheduleModal] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Filter UI is managed by a dedicated Filter modal/page (`filter/page.tsx`).
  // This details page keeps minimal filter inputs (read-only here) so helper
  // functions can be executed when needed without introducing unused setter warnings.
  const [rangeStart] = useState<string>('');
  const [rangeEnd] = useState<string>('');
  const [paginate] = useState<boolean>(true);
  const [_filterLoading, setFilterLoading] = useState(false);
  const [_filterResults, setFilterResults] = useState<FilterResult[]>([]);


  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /**
   * Construction logic for the Image URL.
   * Based on your JSON: path is "storage/programs/..."
   */
  const getImageUrl = (path: string) => {
    if (!path) return "";
    const baseUrl = "https://cinemaapi.kanocitymall.com.ng";
    
    if (path.startsWith("http")) return path;
    
    // Remove leading slash if it exists to prevent double slashes like baseUrl//storage
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    return `${baseUrl}/${cleanPath}`;
  };

  const fetchProgram = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/programs/show-program/${id}`);
      if (res.data?.success) setProgram(res.data.data);
    } catch {
      // Resolved 'unused-vars' by removing the 'err' variable
      toast.error("Failed to load program");
    } finally {
      setLoading(false);
    }
  }, [id, api]);

  useEffect(() => { 
    fetchProgram(); 
  }, [fetchProgram]);

  // --- Fetching helpers for filters / views ---
  const _fetchRangeReviews = async () => {
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
      console.warn('range-reviews failed, falling back to schedules endpoint', error);
      // toast.warning('Failed to load range reviews (showing schedules as fallback)');
      await fetchSchedulesFallback();
    } finally {
      setFilterLoading(false);
    }
  }; 

  const _fetchByStatus = async (status: string) => {
    if (!id) return;
    try {
      setFilterLoading(true);
      const params: Record<string, string> = { paginate: paginate ? 'true' : 'false' };
      if (status && status !== 'All') params.status = status;
      // Using query param for status; backend may accept body or param, adjust as needed
      const res = await api.get(`/programs/program-range-schedules-by-status/${id}`, { params });
      const data = res.data?.data ?? res.data ?? [];
      setFilterResults(Array.isArray(data) ? data : [data]);
    } catch (error: unknown) {
      console.warn('status endpoint failed, no results', error);
      toast.error('Failed to load by-status results');
      setFilterResults([]);
    } finally {
      setFilterLoading(false);
    }
  }; 

  // Helper: convert month picker (YYYY-MM) to full date string (YYYY-MM-01) expected by API
  const formatDateParam = (d: string) => {
    if (!d) return d;
    // If user picks YYYY-MM, convert to YYYY-MM-01 (ISO date-like string)
    if (/^\d{4}-\d{2}$/.test(d)) return `${d}-01`;
    return d; // assume already a valid date string
  };

  const formatEndDateParam = (d: string) => {
    if (!d) return d;
    // Convert YYYY-MM -> YYYY-MM-lastDay
    if (/^\d{4}-\d{2}$/.test(d)) {
      const [y, m] = d.split('-');
      const year = parseInt(y, 10);
      const month = parseInt(m, 10); // 1..12
      const lastDay = new Date(year, month, 0).getDate();
      return `${y}-${m.padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    }
    return d;
  };


  const _fetchByDate = async (dateStr: string) => {
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

  const fetchSchedulesFallback = async () => {
    // Attempt to fetch program schedules via existing endpoints or mock
    try {
      const res = await api.get(`/bookings/schedules?program_id=${id}&status=All`);
      const schedulesData = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
      setFilterResults(Array.isArray(schedulesData) ? schedulesData : [schedulesData]);
    } catch (error: unknown) {
      console.debug('fetchSchedulesFallback error:', error);
      const mockData = mockSchedules(Number(id)).data || [];
      setFilterResults(Array.isArray(mockData) ? mockData : [mockData]);
      toast.warning('Using mock schedules (backend endpoint not available)');
    }
  };

  // Keep references to filter state and helpers to avoid "assigned but never used" warnings
  // These are intentionally preserved for future filter UI integration.
  void _filterLoading;
  void _filterResults;
  void _fetchRangeReviews;
  void _fetchByStatus;
  void _fetchByDate;

  // Filtering is handled by the Filter modal component (see `filter/page.tsx`).

  // Manual fetch: user must click Apply in the Filter Modal to load filtered data
  // (fetchFilteredData will be called on Apply)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const formData = new FormData();
    formData.append("program_id", id as string);
    Array.from(files).forEach((file) => formData.append("images[]", file));

    try {
      setUploading(true);
      await api.post("/programs/upload-program-images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Uploaded successfully!");
      fetchProgram();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this program?")) return;
    try {
      setDeleting(true);
      await api.delete(`/programs/delete-program/${id}`);
      toast.success("Program deleted successfully!");
      router.push("/program/program-list");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleImageClick = (url: string) => {
    setSelectedImg(url);
    setShowModal(true);
  };

  if (loading) return (
    <div className="text-center py-5 vh-100 d-flex align-items-center justify-content-center">
      <Spinner animation="border" variant="warning" />
    </div>
  );

  if (!program) return (
    <div className="text-center mt-5">
      <Button onClick={() => router.back()}>Go Back</Button>
    </div>
  );

  return (
    <div className="container py-4">
      <div className="mx-auto" style={{ maxWidth: "900px" }}>
        
        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          accept="image/*" 
        />

        <div className="d-flex justify-content-between align-items-center mb-4">
          <Button variant="white" className="btn-sm border shadow-sm d-flex align-items-center gap-2 px-3" onClick={() => router.back()}>
            <BsArrowLeft /> Back
          </Button>

          <Dropdown align="end">
            <Dropdown.Toggle variant="white" className="btn-sm border rounded-circle p-2 shadow-sm">
              {uploading || deleting ? <Spinner size="sm" animation="border" variant="warning" /> : <BsThreeDotsVertical />}
            </Dropdown.Toggle>
            <Dropdown.Menu className="shadow border-0">
              <PermissionGuard permission="Manage Programs">
              <div className="px-3 py-2">
                <Link
                  href={`/program/program-list/details/review-details/${program.id}`}
                  className="btn btn-sm btn-outline-success px-3 w-100 d-flex align-items-center justify-content-center gap-2"
                >
                  Reviews
                </Link>
              </div>
              </PermissionGuard>
              <PermissionGuard permission="Manage Programs">
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => fileInputRef.current?.click()}>
                <BsCloudUpload className="me-2 text-primary" /> Upload New Images
              </Dropdown.Item>
              <Dropdown.Divider />
              </PermissionGuard>
              <PermissionGuard permission="Manage Programs">
              <Dropdown.Item className="text-danger" onClick={handleDelete} disabled={deleting}>
                <BsTrash className="me-2" /> {deleting ? "Deleting..." : "Delete Program"}
              </Dropdown.Item>
              </PermissionGuard>
            </Dropdown.Menu>
            
          </Dropdown>
        </div>

        <Card className="shadow-sm border-0 mb-5">
          <Card.Header className="bg-white py-3 border-bottom d-flex align-items-center gap-2">
            <BsInfoCircle className="text-warning fs-5" />
            <h5 className="mb-0 fw-bold">Program Details</h5>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive borderless className="align-middle mb-0">
              <tbody>
                <tr className="border-bottom">
                  <th className="ps-4 py-3 text-muted" style={{ width: "30%" }}>Title</th>
                  <td className="fw-bold">{program.title}</td>
                </tr>
                <tr className="border-bottom">
                  <th className="ps-4 py-3 text-muted">Category</th>
                  <td><Badge bg="info">{program.program_type?.name || "N/A"}</Badge></td>
                </tr>
                <tr>
                  <th className="ps-4 py-3 text-muted">Description</th>
                  <td className="text-secondary py-3 pe-4">{program.description}</td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>



        {/* Action Buttons */}
        
        <div className="mb-4 d-flex gap-2 flex-wrap">
          <PermissionGuard permission="Program Report">
          <Button 
            variant="outline-secondary" 
            className="rounded-3 px-3" 
            onClick={() => router.push(`/program/program-list/details/${program.id}/filter`)}
          >
            Select Type
          </Button>
          </PermissionGuard>
          <PermissionGuard permission="Pay for Booking">
          <Button 
            variant="success" 
            className="rounded-3 px-4 d-flex align-items-center gap-2"
            onClick={() => {
              setShowSelectScheduleModal(true);
              setLoadingSchedules(true);
              const api = getApiClientInstance();

              const normalizeList = (list: unknown[]): Schedule[] => {
                return list
                  .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
                  .map((raw) => {
                    const id = Number(raw['id'] ?? 0);
                    const programObj = (typeof raw['program'] === 'object' && raw['program'] !== null) ? (raw['program'] as Record<string, unknown>) : undefined;
                    const programTitle = programObj ? String(programObj['title'] ?? '') : String(raw['program'] ?? '') || program.title;
                    const programId = programObj ? Number(programObj['id'] ?? raw['program_id'] ?? 0) : Number(raw['program_id'] ?? 0);
                    const hallObj = (typeof raw['hall'] === 'object' && raw['hall'] !== null) ? (raw['hall'] as Record<string, unknown>) : undefined;
                    const hallName = hallObj ? String(hallObj['name'] ?? raw['hall_name'] ?? raw['hallName'] ?? '') : String(raw['hall_name'] ?? raw['hallName'] ?? '');
                    const starttime = String(raw['starttime'] ?? raw['time'] ?? raw['start_time'] ?? raw['time_slot'] ?? '');
                    const endtime = String(raw['endtime'] ?? raw['end_time'] ?? raw['time_end'] ?? '');
                    const date = String(raw['date'] ?? raw['datetime'] ?? raw['date_time'] ?? '');

                    return {
                      id,
                      program_id: programId || undefined,
                      program: { id: programId || undefined, title: programTitle || undefined },
                      title: String(raw['title'] ?? ''),
                      date,
                      starttime,
                      endtime,
                      hall: hallName ? { name: hallName } : null,
                      hall_name: hallName,
                      hall_id: raw['hall_id'] ? Number(raw['hall_id']) : undefined,
                    } as Schedule;
                  });
              };

              // Preferred bookings endpoint that accepts program_id as a query
              api.get(`/bookings/schedules?program_id=${program.id}&status=All`)
                .then(res => {
                  const schedulesData = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
                  const list = Array.isArray(schedulesData) ? schedulesData : [];
                  let normalized = normalizeList(list);
                  normalized = normalized.filter((s) => {
                    const pid = Number(s.program_id ?? s.program?.id ?? 0);
                    return pid === Number(program.id) || String(s.program?.title || s.title || '').trim() === String(program.title).trim();
                  });
                  setSchedules(normalized);
                  if (normalized.length > 0) setSelectedScheduleId(normalized[0].id);
                })
                .catch((error: unknown) => {
                  const err = error as { response?: { status?: number } };
                  // Fallback to legacy endpoint or mock schedules
                  if (err?.response?.status === 404) {
                    api.get(`/schedules/program/${program.id}`)
                      .then(r => {
                        const schedulesData = r.data?.data?.data ?? r.data?.data ?? r.data ?? [];
                        const list = Array.isArray(schedulesData) ? schedulesData : [];
                        let normalized = normalizeList(list);
                        normalized = normalized.filter((s) => {
                          const pid = Number(s.program_id ?? s.program?.id ?? 0);
                          return pid === Number(program.id) || String(s.program?.title || s.title || '').trim() === String(program.title).trim();
                        });
                        setSchedules(normalized);
                        if (normalized.length > 0) setSelectedScheduleId(normalized[0].id);
                      })
                      .catch(() => {
                        const mockData = mockSchedules(program.id);
                        const schedulesData = mockData.data || [];
                        const normalized = normalizeList(Array.isArray(schedulesData) ? schedulesData : []);
                        setSchedules(normalized);
                        if (normalized.length > 0) setSelectedScheduleId(normalized[0].id);
                        toast.warning("Using mock schedules (backend API not yet implemented)");
                      });
                  } else {
                    console.error("Failed to load schedules:", err);
                    toast.error("Failed to load schedules");
                  }
                })
                .finally(() => setLoadingSchedules(false));
            }}
          >
            <MdEventSeat /> Buy Tickets
            
          </Button>
          </PermissionGuard>
          <PermissionGuard permission="Create Schedule">
          <Button 
            variant="primary" 
            className="rounded-3 px-4"
            onClick={() => setShowCreateScheduleModal(true)}
          >
            Create Schedule
          </Button>
          </PermissionGuard>
          <Button 
            variant="outline-primary" 
            className="rounded-3 px-4"
            onClick={() => router.push(`/schedule/schedule-list?program_id=${program.id}`)}
          >
            View Schedules
          </Button>
        </div>

        {/* Gallery Section */}
        <div className="mb-5">
          <div className="d-flex align-items-center gap-2 mb-4">
            <BsImage className="text-primary fs-4" />
            <h5 className="fw-bold mb-0">Program Media ({program.images?.length || 0})</h5>
          </div>

          {!program.images || program.images.length === 0 ? (
            <div className="alert alert-info d-flex align-items-center gap-2">
              <BsImage /> No images uploaded yet. Click the menu to upload images.
            </div>
          ) : (
            <Row className="g-3">
              {program.images.map((img) => {
                const url = getImageUrl(img.image_path);
                return (
                  <Col xs={6} md={4} key={img.id}>
                    <div 
                      className="gallery-card shadow-sm rounded border overflow-hidden position-relative"
                      onClick={() => handleImageClick(url)}
                      style={{ cursor: 'zoom-in', position: 'relative', width: '100%', height: '200px' }}
                    >
                      <Image 
                        src={url} 
                        alt="Gallery" 
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
                      />
                      <div className="overlay d-flex align-items-center justify-content-center" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)' }}>
                         <span className="text-white small fw-bold">Click to Expand</span>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </div>

        {/* Lightbox Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
          <Modal.Body className="p-0 position-relative text-center bg-dark rounded">
            <Button 
              variant="link" 
              className="position-absolute top-0 end-0 m-2 text-white"
              onClick={() => setShowModal(false)}
              style={{ zIndex: 10 }}
            >
              <BsX size={30} />
            </Button>
            <Image 
              src={selectedImg} 
              alt="Full View" 
              className="img-fluid" 
              width={1200}
              height={800}
              unoptimized
              style={{ maxHeight: '90vh', objectFit: 'contain' }}
            />
          </Modal.Body>
        </Modal>

        {/* Schedule Form Modal */}
        <Modal show={showCreateScheduleModal} onHide={() => setShowCreateScheduleModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Create Schedule for {program?.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ScheduleForm 
              programId={program?.id} 
              onSuccess={() => {
                setShowCreateScheduleModal(false);
                toast.success("Schedule created successfully!");
              }} 
            />
          </Modal.Body>
        </Modal>

        {/* Schedule Selection Modal for Seat Booking */}
        <Modal show={showSelectScheduleModal} onHide={() => { setShowSelectScheduleModal(false); setSchedules([]); setSelectedScheduleId(null); }} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Select Schedule for Seat Booking</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {loadingSchedules ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading schedules...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="alert alert-warning">
                No schedules available. Please create a schedule first.
              </div>
            ) : (
              <div>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Select a Schedule *</Form.Label>
                  {!isMobile ? (
                    <Form.Select 
                      value={selectedScheduleId || ""} 
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedScheduleId(parseInt(e.target.value))}
                    >
                      <option value="">Choose a schedule...</option>
                      {schedules.map(schedule => {
                        const programName = schedule.program?.title || program.title || schedule.title || "Program";
                        const dateVal = schedule.date || schedule.datetime || schedule.date_time || "";
                        const weekday = dateVal ? new Date(dateVal).toLocaleDateString(undefined, { weekday: 'long' }) : "";
                        const formattedDate = dateVal ? new Date(dateVal).toLocaleDateString() : schedule.date || "";
                        const start = schedule.starttime || schedule.time || schedule.start_time || "";
                        const end = schedule.endtime || schedule.end_time || "";
                        const formatTime = (t: string) => {
                          try {
                            if (/^\d{2}:\d{2}$/.test(String(t))) {
                              const [hh, mm] = String(t).split(":");
                              const d = new Date(); d.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
                              return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                            }
                            const d = new Date(String(t).replace(' ', 'T'));
                            return isNaN(d.getTime()) ? String(t) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                          } catch { return String(t); }
                        };
                        const timeLabel = start ? `${formatTime(start)}${end ? ' - ' + formatTime(end) : ''}` : '';
                        const hallName = schedule.hall?.name || schedule.hall_name || schedule.hallName || '';
                        const label = `${programName} — ${weekday ? weekday + ',' : ''} ${formattedDate}${timeLabel ? ' · ' + timeLabel : ''}${hallName ? ' · ' + hallName : ''}`;

                        return (
                          <option key={schedule.id} value={schedule.id}>
                            {label}
                          </option>
                        );
                      })}
                    </Form.Select>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {schedules.map(schedule => {
                        const programName = schedule.program?.title || program.title || schedule.title || "Program";
                        const dateVal = schedule.date || schedule.datetime || schedule.date_time || "";
                        const formattedDate = dateVal ? new Date(dateVal).toLocaleDateString() : schedule.date || "";
                        const start = schedule.starttime || schedule.time || schedule.start_time || "";
                        const end = schedule.endtime || schedule.end_time || "";
                        const hallName = schedule.hall?.name || schedule.hall_name || schedule.hallName || '';
                        const formatTime = (t: string) => {
                          try {
                            if (/^\d{2}:\d{2}$/.test(String(t))) {
                              const [hh, mm] = String(t).split(":");
                              const d = new Date(); d.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
                              return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                            }
                            const d = new Date(String(t).replace(' ', 'T'));
                            return isNaN(d.getTime()) ? String(t) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                          } catch { return String(t); }
                        };
                        const timeLabel = start ? `${formatTime(start)}${end ? ' - ' + formatTime(end) : ''}` : '';

                        return (
                          <div key={schedule.id} className="card p-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <div className="fw-bold">{programName}</div>
                                <div className="small text-muted">{formattedDate}{timeLabel ? ' · ' + timeLabel : ''}</div>
                                {hallName && <div className="small">Hall: {hallName}</div>}
                              </div>
                              <div>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => {
                                    setSelectedScheduleId(schedule.id);
                                    router.push(
                                      `/booking/schedule-seat-booking?` +
                                      `schedule_id=${schedule.id}&` +
                                      `program_id=${program.id}&` +
                                      `hall_id=${schedule.hall_id || schedule.hall?.id || schedule.hall_id}`
                                    );
                                  }}
                                >
                                  Select
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Form.Group>
<PermissionGuard permission="Manage Schedules">
                <Button 
                  variant="success" 
                  className="w-100"
                  onClick={() => {
                    const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
                    if (selectedSchedule) {
                      router.push(
                        `/booking/schedule-seat-booking?` +
                        `schedule_id=${selectedScheduleId}&` +
                        `program_id=${program.id}&` +
                        `hall_id=${selectedSchedule.hall_id}`
                      );
                    }
                  }}
                >
                  Proceed to Seat Booking
                </Button>
                </PermissionGuard>
              </div>
            )}
          </Modal.Body>
        </Modal>

        {/* Filter Section (Select Type) - Full Page */}
        {/* Moved to separate filter page */}

      </div>

      <style jsx>{`
        .gallery-card :global(img) {
          transition: transform 0.3s ease;
        }
        .gallery-card:hover :global(img) {
          transform: scale(1.05);
        }
        .gallery-card .overlay {
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .gallery-card:hover .overlay {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}