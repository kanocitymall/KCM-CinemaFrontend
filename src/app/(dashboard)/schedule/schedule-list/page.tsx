"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "react-bootstrap";
import { IoFilter } from "react-icons/io5";
import { BsCalendar, BsClock, BsBuilding } from "react-icons/bs";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { mockSchedulesList } from "@/app/utils/api-mock";
import { toast } from "react-toastify";
import Loading from "../../components/loading";
import PageHeader from "../../components/page-header";
import PermissionGuard from "../../components/PermissionGuard";
import QRScanner from "../../booking/chack-in/cameraScanner";
import { MdCamera } from 'react-icons/md';

// --- Interfaces ---
interface ProgramImage {
  id: number;
  image_path: string;
}

interface Schedule {
  id: number;
  program_id: number;
  hall_id: number;
  date: string;
  starttime: string;
  endtime: string;
  regular_price: string;
  vip_price: string;
  status: string;
  program: { 
    id?: number;
    title: string; 
    duration: string;
    images?: ProgramImage[];
  };
  hall: { name: string };
}

interface ScheduleResponse {
  success: boolean;
  data: {
    current_page: number;
    data: Schedule[];
    last_page: number;
  };
}

const getImageUrl = (path: string) => {
  if (!path) return "";
  const baseUrl = "https://cinemaapi.kanocitymall.com.ng";
  if (path.startsWith("http")) return path;
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  return `${baseUrl}/${cleanPath}`;
};

const SchedulePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const api = useMemo(() => getApiClientInstance(), []);

  const [loading, setLoading] = useState<boolean>(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [completingScheduleId, setCompletingScheduleId] = useState<number | null>(null);

  // ✅ CORRECTION: Removed underscore and 'void' hack for active use
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [scannerScheduleId, setScannerScheduleId] = useState<number | null>(null);

  const fetchSchedules = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      try {
        const res = await api.get<ScheduleResponse>(
          `/bookings/schedules?page=${page}&status=All`
        );
        if (res.data?.success) {
          setSchedules(res.data.data.data);
        }
      } catch (err: unknown) {
        interface ApiError { response?: { status?: number } }
        const apiErr = err as ApiError;
        if (apiErr?.response?.status === 404) {
          console.warn("⚠️ Using mock data.");
          const mockData = mockSchedulesList();
          if (mockData.data?.data) {
            setSchedules(mockData.data.data);
          }
          toast.warning("Using mock schedules");
        } else {
          toast.error("Failed to load schedules");
        }
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  useEffect(() => {
    fetchSchedules(currentPage);
  }, [fetchSchedules, currentPage]);

  useEffect(() => {
    const filterParam = searchParams?.get('filter');
    if (filterParam) {
      setStatusFilter(filterParam);
    }
  }, [searchParams]);

  const filteredSchedules = useMemo(() => {
    let filtered = schedules.filter((s) =>
      s.program?.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter((s) => (s.date || '').startsWith(today));
    } else if (statusFilter === 'scheduled') {
      filtered = filtered.filter((s) => String(s.status || '').toLowerCase().includes('scheduled'));
    } else if (statusFilter === 'canceled') {
      filtered = filtered.filter((s) => String(s.status || '').toLowerCase().includes('cancel'));
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter((s) => String(s.status || '').toLowerCase().includes('complete'));
    }

    return filtered;
  }, [schedules, searchTerm, statusFilter]);

  const formatTime = (timeStr: string): string => {
    try {
      const date = new Date(timeStr.replace(" ", "T"));
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch { return timeStr; }
  };

  const isSchedulePast = (schedule: Schedule): boolean => {
    try {
      const endTime = new Date(schedule.endtime.replace(" ", "T"));
      return endTime < new Date();
    } catch { return false; }
  };

  const handleMarkCompleted = useCallback(
    async (scheduleId: number) => {
      setCompletingScheduleId(scheduleId);
      try {
        const res = await api.patch(`/bookings/mark-schedule-completed/${scheduleId}`, {});
        if (res?.data?.success) {
          toast.success("Schedule marked as completed");
          setSchedules((prev) =>
            prev.map((s) => s.id === scheduleId ? { ...s, status: "Completed" } : s)
          );
        }
      } catch {
          toast.error("Failed to mark schedule as completed");
        } finally {
        setCompletingScheduleId(null);
      }
    },
    [api]
  );

  return (
    <section>
      <PageHeader title="Schedules">
        <div className="d-flex gap-2 align-items-center">
          <button className="btn d-none d-md-flex align-items-center gap-2">
            <IoFilter /> Filter
          </button>
          <input
            type="search"
            className="form-control tw-text-sm d-none d-md-block"
            placeholder="Search by program name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '250px' }}
          />
        </div>
      </PageHeader>

      {loading ? (
        <Loading />
      ) : (
        <section className="pt-4">
          {filteredSchedules.length > 0 ? (
            <div className="row g-4">
              {filteredSchedules.map((schedule) => {
                const programImage = schedule.program?.images?.[0];
                const imageUrl = programImage ? getImageUrl(programImage.image_path) : "";
                const dateParts = (schedule.date || "").toString().split('-');
                const dateObj = dateParts.length === 3 
                  ? new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2])) 
                  : new Date(schedule.date);
                
                const dateStr = dateObj.toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
                const timeRange = `${formatTime(schedule.starttime)} - ${formatTime(schedule.endtime)}`;

                return (
                  <div key={schedule.id} className="col-12 col-sm-6 col-lg-4">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "12px", overflow: 'hidden' }}>
                      <div style={{ position: 'relative', height: 200, background: '#f5f5f5' }}>
                        {imageUrl ? (
                          <Image src={imageUrl} alt={schedule.program?.title} fill unoptimized style={{ objectFit: 'cover' }} />
                        ) : (
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light">No Image</div>
                        )}
                        <Badge bg={schedule.status === "Scheduled" ? "success" : "secondary"} className="position-absolute top-0 end-0 m-2">
                          {schedule.status}
                        </Badge>
                      </div>

                      <div className="card-body d-flex flex-column">
                        <h5 className="fw-bold mb-2">{schedule.program?.title}</h5>
                        <div className="d-flex flex-column mb-2 small text-muted">
                          <div className="d-flex align-items-center gap-2"><BsCalendar size={14} />{dateStr}</div>
                          <div className="d-flex align-items-center gap-2"><BsClock size={14} />{timeRange}</div>
                        </div>
                        <div className="small text-muted mb-3 d-flex align-items-center gap-2"><BsBuilding size={14} />{schedule.hall?.name}</div>

                        <div className="d-flex justify-content-between align-items-center mb-3 p-2 rounded" style={{ background: '#f8f9fa' }}>
                          <div>
                            <div className="small text-muted">Regular</div>
                            <div className="fw-bold">₦{Number(schedule.regular_price || 0).toLocaleString()}</div>
                          </div>
                          <div className="text-end">
                            <div className="small text-muted">VIP</div>
                            <div className="fw-bold">₦{Number(schedule.vip_price || 0).toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="d-flex gap-2 mt-auto">
                          <button className="btn btn-outline-primary btn-sm flex-grow-1" onClick={() => router.push(`/schedule/schedule-list/${schedule.id}`)}>Details</button>
                          {!isSchedulePast(schedule) ? (
                            <button className="btn btn-primary btn-sm flex-grow-1" onClick={() => router.push(`/booking/schedule-seat-booking?schedule_id=${schedule.id}&program_id=${schedule.program_id}&hall_id=${schedule.hall_id}`)}>Buy Ticket</button>
                          ) : (
                            <button 
                              className="btn btn-success btn-sm flex-grow-1" 
                              onClick={() => handleMarkCompleted(schedule.id)}
                              disabled={completingScheduleId === schedule.id || schedule.status === "Completed"}
                            >
                              {completingScheduleId === schedule.id ? "Completing..." : schedule.status === "Completed" ? "Completed" : "Mark Complete"}
                             
                            </button>
                          )}
                        </div>

                        {statusFilter === 'today' && (
                          <div className="mt-2 d-flex gap-2">
                            {/* ✅ CORRECTION: Using scannerScheduleId state correctly */}
                            <PermissionGuard permission="Manage Booking Payment">
                            <button className="btn btn-warning d-flex align-items-center gap-2 text-nowrap btn-sm w-100" onClick={() => { setShowScanner(true); setScannerScheduleId(schedule.id); }}>
                              
                            <MdCamera /> Start Check-in now
                            </button>
                            </PermissionGuard>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-5">No schedules found</div>
          )}
        </section>
      )}

      {/* Scanner modal */}
      {showScanner && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.9)', zIndex: 1050 }}>
          <div className="modal-dialog modal-fullscreen">
            <div className="modal-content" style={{ height: '100vh' }}>
              <div className="modal-header d-flex align-items-center">
                <button className="btn btn-light me-3" onClick={() => { setShowScanner(false); setScannerScheduleId(null); }}>
                  Back
                </button>
                <h5 className="modal-title text-center w-100">Scan QR Code</h5>
                <button type="button" className="btn-close" onClick={() => { setShowScanner(false); setScannerScheduleId(null); }}></button>
              </div>
              <div className="modal-body d-flex justify-content-center align-items-center" style={{ height: 'calc(100vh - 80px)' }}>
                {/* ✅ CORRECTION: Passing the captured scannerScheduleId to the QRScanner */}
                <QRScanner
                  scheduleId={scannerScheduleId}
                  bookingId={null}
                  onSuccessfulScan={(p: unknown) => {
                    const payload = (p as { name?: string } | null) ?? null;
                    const name = payload?.name ?? 'Customer';
                    toast.success(`${name} checked in successfully`);
                    setShowScanner(false);
                    setScannerScheduleId(null);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SchedulePage;