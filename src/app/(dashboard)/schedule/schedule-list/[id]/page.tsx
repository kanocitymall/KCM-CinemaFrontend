"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Card, Badge, Modal, Form } from "react-bootstrap";
import { AxiosError } from "axios";
import { BsArrowLeft, BsPencilSquare, BsTrash } from "react-icons/bs";
import { MdCamera, MdClose } from 'react-icons/md';
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { toast } from "react-toastify";
import Loading from "../../../components/loading";
import PermissionGuard from "../..//../components/PermissionGuard";

// --- Interfaces ---
interface Program {
    id: number;
    program_type_id: number;
    title: string;
    description: string;
    duration: string;
    rating: number;
    status: number;
}

interface Hall {
    id: number;
    name: string;
    code: string;
    total_seats: number;
    seat_layout: string;
    details: string;
    status: number;
}

interface Schedule {
    id: number;
    program_id: number;
    hall_id: number;
    details: string;
    date: string;
    starttime: string;
    endtime: string;
    regular_price: string;
    vip_price: string;
    user_id: number;
    status: string;
    created_at: string;
    updated_at: string;
    program: Program;
    hall: Hall;
}

interface ScheduleDetailResponse {
    success: boolean;
    data: Schedule;
    message: string;
}

const ScheduleDetailPage = () => {
    const router = useRouter();
    const params = useParams();
    const scheduleId = params.id as string;
    const api = useMemo(() => getApiClientInstance(), []);

    const [loading, setLoading] = useState(true);
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [editFormData, setEditFormData] = useState({
        details: "",
        date: "",
        starttime: "",
        endtime: "",
        regular_price: "",
        vip_price: "",
    });

    const fetchScheduleDetail = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<ScheduleDetailResponse>(`/bookings/show-schedule/${scheduleId}`);
            if (res.data?.data) {
                setSchedule(res.data.data);
            }
        } catch {
            toast.error("Failed to fetch schedule details");
        } finally {
            setLoading(false);
        }
    }, [api, scheduleId]);

    useEffect(() => {
        fetchScheduleDetail();
    }, [fetchScheduleDetail]);

    const handleOpenEditModal = () => {
        if (schedule) {
            setEditFormData({
                details: schedule.details,
                date: schedule.date.split("T")[0],
                starttime: new Date(schedule.starttime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                }),
                endtime: new Date(schedule.endtime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                }),
                regular_price: schedule.regular_price,
                vip_price: schedule.vip_price,
            });
            setShowEditModal(true);
        }
    };

    const handleUpdateSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Convert 24-hour time format to 12-hour format with AM/PM
            const convertTo12Hour = (time: string) => {
                const [hours, minutes] = time.split(":");
                const hour = parseInt(hours);
                const ampm = hour >= 12 ? "PM" : "AM";
                const displayHour = hour % 12 || 12;
                return `${displayHour}:${minutes} ${ampm}`;
            };

            const payload = {
                details: editFormData.details,
                date: editFormData.date,
                starttime: convertTo12Hour(editFormData.starttime),
                endtime: convertTo12Hour(editFormData.endtime),
                regular_price: parseFloat(editFormData.regular_price),
                vip_price: parseFloat(editFormData.vip_price),
            };
            await api.put(`/bookings/update-schedule/${scheduleId}`, payload);
            toast.success("Schedule updated successfully");
            setShowEditModal(false);
            fetchScheduleDetail();
        } catch (err: AxiosError<{ message?: string }> | unknown) {
            const errorMessage = (err as AxiosError<{ message?: string }>).response?.data?.message || "Update failed";
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteSchedule = async () => {
        if (!window.confirm("Are you sure you want to delete this schedule?")) return;
        setSubmitting(true);
        try {
            await api.delete(`/bookings/delete-schedule/${scheduleId}`);
            toast.success("Schedule deleted successfully");
            router.push("/schedule/schedule-list");
        } catch (err: AxiosError<{ message?: string }> | unknown) {
            const errorMessage = (err as AxiosError<{ message?: string }>).response?.data?.message || "Delete failed";
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelSchedule = async () => {
        if (!window.confirm("Are you sure you want to cancel this schedule? All booking customers will be notified.")) return;
        setCancelling(true);
        try {
            await api.patch(`/bookings/cancel-schedule/${scheduleId}`);
            toast.success("Schedule cancelled successfully. All customers have been notified.");
            fetchScheduleDetail();
        } catch (err: AxiosError<{ message?: string }> | unknown) {
            const errorMessage = (err as AxiosError<{ message?: string }>).response?.data?.message || "Cancel failed";
            toast.error(errorMessage);
        } finally {
            setCancelling(false);
        }
    };

    if (loading) return <Loading />;

    if (!schedule) {
        return (
            <section className="container py-4">
                <div className="alert alert-danger text-center py-5">
                    <p className="mb-0">Schedule not found.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="container py-4">
            <div className="mb-4 d-flex justify-content-between align-items-center">
                <Button
                    variant="light"
                    onClick={() => router.back()}
                    className="border rounded-pill px-3 shadow-sm"
                >
                    <BsArrowLeft className="me-2" /> Back
                </Button>
                <div className="d-flex gap-1 gap-sm-2 align-items-center">
                    <PermissionGuard permission="Manage Schedules">
                    <Button
                        variant="warning"
                        onClick={handleCancelSchedule}
                        disabled={cancelling || submitting}
                        className="btn-sm rounded-pill px-2 d-flex align-items-center gap-1"
                        title="Cancel schedule"
                    >
                        <MdClose />
                        <span className="d-none d-sm-inline">{cancelling ? 'Cancelling...' : 'Cancel'}</span>
                    </Button>
                    </PermissionGuard>
                    <PermissionGuard permission="Manage Schedules">
                    <Button
                        variant="info"
                        onClick={() => router.push(`/booking/participants-check-in/${scheduleId}`)}
                        className="btn-sm rounded-pill px-2 d-flex align-items-center gap-1"
                        title="Check-In"
                    >
                        <MdCamera />
                        <span className="d-none d-sm-inline">Check-In</span>
                    </Button>
                    </PermissionGuard>
                    <PermissionGuard permission="Edit Schedule">
                    <Button
                        variant="primary"
                        onClick={handleOpenEditModal}
                        className="btn-sm rounded-pill px-2 d-flex align-items-center gap-1"
                        title="Edit schedule"
                    >
                        <BsPencilSquare />
                        <span className="d-none d-sm-inline"> Edit</span>
                    </Button>
                    </PermissionGuard>
                    <PermissionGuard permission="Delete Schedule">
                    <Button
                        variant="danger"
                        onClick={handleDeleteSchedule}
                        disabled={submitting}
                        className="btn-sm rounded-pill px-2 d-flex align-items-center gap-1"
                        title="Delete schedule"
                    >
                        <BsTrash />
                        <span className="d-none d-sm-inline"> Delete</span>
                    </Button>
                    </PermissionGuard>
                </div>
            </div>

            <div className="row justify-content-center">
                <div className="col-lg-10">
                    <Card className="shadow-sm border-0 rounded-4 mb-4">
                        <Card.Header className="bg-light border-0 rounded-top-4 py-3">
                            <h5 className="fw-bold mb-0">Schedule Details</h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <div className="row mb-4">
                                <div className="col-md-6 mb-3">
                                    <label className="small fw-bold text-muted">Program</label>
                                    <p className="fs-6 fw-semibold">{schedule.program?.title}</p>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="small fw-bold text-muted">Hall</label>
                                    <p className="fs-6 fw-semibold">{schedule.hall?.name}</p>
                                </div>
                            </div>

                            <div className="row mb-4">
                                <div className="col-md-6 mb-3">
                                    <label className="small fw-bold text-muted">Description</label>
                                    <p className="fs-6">{schedule.program?.description || "N/A"}</p>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="small fw-bold text-muted">Duration</label>
                                    <p className="fs-6 fw-semibold">{schedule.program?.duration || "N/A"}</p>
                                </div>
                            </div>

                            <div className="row mb-4">
                                <div className="col-md-6 mb-3">
                                    <label className="small fw-bold text-muted">Date</label>
                                    <p className="fs-6 fw-semibold">
                                        {new Date(schedule.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="small fw-bold text-muted">Status</label>
                                    <p className="fs-6 fw-semibold">
                                        <Badge bg={schedule.status === "Scheduled" ? "success" : "secondary"}>
                                            {schedule.status}
                                        </Badge>
                                    </p>
                                </div>
                            </div>

                            <div className="row mb-4">
                                <div className="col-md-6 mb-3">
                                    <label className="small fw-bold text-muted">Start Time</label>
                                    <p className="fs-6 fw-semibold">
                                        {new Date(schedule.starttime).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true,
                                        })}
                                    </p>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="small fw-bold text-muted">End Time</label>
                                    <p className="fs-6 fw-semibold">
                                        {new Date(schedule.endtime).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true,
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="small fw-bold text-muted">Details</label>
                                <p className="fs-6">{schedule.details}</p>
                            </div>

                            <hr />

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="small fw-bold text-muted">Regular Price</label>
                                    <p className="fs-5 fw-semibold text-success">
                                        ₦{parseFloat(schedule.regular_price).toLocaleString()}
                                    </p>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="small fw-bold text-muted">VIP Price</label>
                                    <p className="fs-5 fw-semibold text-success">
                                        ₦{parseFloat(schedule.vip_price).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm border-0 rounded-4">
                        <Card.Header className="bg-light border-0 rounded-top-4 py-3">
                            <h5 className="fw-bold mb-0">Additional Information</h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="small fw-bold text-muted">Hall Code</label>
                                    <p className="fs-6 fw-semibold">{schedule.hall?.code}</p>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="small fw-bold text-muted">Total Seats</label>
                                    <p className="fs-6 fw-semibold">{schedule.hall?.total_seats}</p>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="small fw-bold text-muted">Schedule Date</label>
                                    <p className="fs-6 fw-semibold">
                                        {new Date(schedule.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="small fw-bold text-muted">Schedule Updated</label>
                                    <p className="fs-6 fw-semibold">
                                        {new Date(schedule.updated_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>

            {/* EDIT SCHEDULE MODAL */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
                <Form onSubmit={handleUpdateSchedule}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold">Edit Schedule</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <div className="mb-3">
                            <Form.Label className="small fw-bold">Details</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                placeholder="e.g. Films, Sports, etc."
                                value={editFormData.details}
                                onChange={(e) => setEditFormData({ ...editFormData, details: e.target.value })}
                                required
                            />
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <Form.Label className="small fw-bold">Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={editFormData.date}
                                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <Form.Label className="small fw-bold">Start Time</Form.Label>
                                <Form.Control
                                    type="time"
                                    value={editFormData.starttime}
                                    onChange={(e) => setEditFormData({ ...editFormData, starttime: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <Form.Label className="small fw-bold">End Time</Form.Label>
                                <Form.Control
                                    type="time"
                                    value={editFormData.endtime}
                                    onChange={(e) => setEditFormData({ ...editFormData, endtime: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <Form.Label className="small fw-bold">Regular Price (₦)</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={editFormData.regular_price}
                                    onChange={(e) => setEditFormData({ ...editFormData, regular_price: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <Form.Label className="small fw-bold">VIP Price (₦)</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={editFormData.vip_price}
                                    onChange={(e) => setEditFormData({ ...editFormData, vip_price: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="border-0">
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={submitting}>
                            {submitting ? "Updating..." : "Update Schedule"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </section>
    );
};

export default ScheduleDetailPage;
