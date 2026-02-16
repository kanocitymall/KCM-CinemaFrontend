"use client";

import React, { useEffect, useState, useCallback, useMemo, FormEvent, use } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal, Form } from "react-bootstrap";
import { BsArrowLeft, BsPencilSquare, BsPlusLg, BsXCircleFill } from "react-icons/bs";
import { MdEventSeat } from "react-icons/md";
import { AxiosError } from "axios";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { toast } from "react-toastify";
import Loading from "../../../../../components/loading";

interface Hall {
    id: number;
    name: string;
    code: string;
    total_seats: number;
    seat_layout: string | null;
    details: string | null;
    status: number;
    price: number;
    checkin_price: number;
    agent_commission: number;
}

interface Seat {
    id: number;
    hall_id: number;
    seat_row: string;
    seat_number: number;
    label: string;
    seat_type: string;
    status: number;
}

const BookSeatsPage = ({ params }: { params: Promise<{ id: string }> }) => {
    const resolvedParams = use(params);
    const hallId = resolvedParams.id;
    const router = useRouter();
    const api = useMemo(() => getApiClientInstance(), []);

    const [hall, setHall] = useState<Hall | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [seats, setSeats] = useState<Seat[]>([]);
    
    // Grid Setup - rows are now dynamic from database

    // Modals
    const [showManageModal, setShowManageModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [activeSeat, setActiveSeat] = useState<Seat | null>(null);
    const [editSeatData, setEditSeatData] = useState({ 
        seat_row: "", 
        seat_number: "", 
        seat_type: "Regular" 
    });

    // Create Form (Row as Letter, Number as Digit)
    const [seatFormData, setSeatFormData] = useState({ 
        seat_row: "A", 
        seat_number: "1", 
        seat_type: "Regular" 
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [hallRes, seatsRes] = await Promise.all([
                api.get(`/halls/get-hall/${hallId}`),
                api.get(`/seats/get-seats-by-hall/${hallId}`)
            ]);
            setHall(hallRes.data?.data);
            const seatsArray = seatsRes.data?.data?.data || seatsRes.data?.data || [];
            setSeats(Array.isArray(seatsArray) ? seatsArray : []);
        } catch (error) {
            console.error("Fetch error", error);
        } finally {
            setLoading(false);
        }
    }, [hallId, api]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreateSeat = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Backend expects: seat_row: "A", seat_number: 1
            const res = await api.post("/seats/create-seat", { 
                ...seatFormData, 
                seat_number: parseInt(seatFormData.seat_number),
                hall_id: hallId 
            });
            if (res.data?.success) {
                toast.success(`Seat ${seatFormData.seat_row}${seatFormData.seat_number} Created`);
                setShowCreateModal(false);
                fetchData();
            }
        } catch (error: AxiosError<{ message?: string }> | unknown) { 
            const errorMessage = error instanceof AxiosError
                ? error.response?.data?.message || "Creation failed"
                : "Creation failed";
            toast.error(errorMessage);
        }
        finally { setSubmitting(false); }
    };

    const handleDeleteSeat = async () => {
        if (!activeSeat || !window.confirm(`Delete seat ${activeSeat.seat_row}${activeSeat.seat_number}?`)) return;
        try {
            await api.delete(`/seats/delete-seat/${activeSeat.id}`);
            toast.success("Seat removed");
            fetchData();
            setShowManageModal(false);
        } catch (error) { 
            console.error("Delete failed:", error);
            toast.error("Delete failed"); 
        }
    };

    const handleEditLabel = async () => {
        if (!activeSeat || !editSeatData.seat_row.trim()) {
            toast.error("Please fill in all fields");
            return;
        }
        try {
            setSubmitting(true);
            await api.put(`/seats/update-seat/${activeSeat.id}`, { 
                seat_row: editSeatData.seat_row.toUpperCase(),
                seat_number: parseInt(editSeatData.seat_number),
                seat_type: editSeatData.seat_type
            });
            toast.success("Seat updated successfully");
            setShowEditModal(false);
            fetchData();
            setShowManageModal(false);
        } catch (error: AxiosError<{ message?: string }> | unknown) {
            const errorMessage = error instanceof AxiosError
                ? error.response?.data?.message || "Update failed"
                : "Update failed";
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleSeat = async () => {
        if (!activeSeat) return;
        try {
            setSubmitting(true);
            await api.patch(`/seats/toggle-seat/${activeSeat.id}`);
            toast.success("Seat status toggled");
            fetchData();
            setShowManageModal(false);
        } catch (error) {
            console.error("Toggle failed:", error);
            toast.error("Toggle failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loading />;

    // Get unique row letters from actual seats in database
    const availableRowLetters = [...new Set(seats.map(s => s.seat_row))].sort();
    
    // If no seats exist, show empty message
    if (availableRowLetters.length === 0) {
        return (
            <section className="container py-4">
                <div className="mb-4 d-flex justify-content-between align-items-center">
                    <Button variant="light" onClick={() => router.back()} className="border rounded-pill px-3 shadow-sm">
                        <BsArrowLeft className="me-2" /> Back
                    </Button>
                    <h4 className="fw-bold mb-0">{hall?.name} - Layout Management</h4>
                    <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)} className="rounded-pill px-3">
                        <BsPlusLg className="me-1" /> Add Seat
                    </Button>
                </div>
                <div className="alert alert-info text-center py-5">
                    <p className="mb-0">No seats created yet. Add the first seat to start building the layout.</p>
                </div>
                {/* CREATE MODAL */}
                <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
                    <Form onSubmit={handleCreateSeat}>
                        <Modal.Header closeButton><Modal.Title className="fw-bold">Add Seat to Layout</Modal.Title></Modal.Header>
                        <Modal.Body className="p-4">
                            <div className="row">
                                <div className="col-6 mb-3">
                                    <Form.Label className="small fw-bold">Row (Letter)</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="e.g. A" 
                                        maxLength={1}
                                        className="text-uppercase"
                                        required 
                                        onChange={e => setSeatFormData({...seatFormData, seat_row: e.target.value.toUpperCase()})} 
                                    />
                                </div>
                                <div className="col-6 mb-3">
                                    <Form.Label className="small fw-bold">Number</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        placeholder="e.g. 1" 
                                        required 
                                        onChange={e => setSeatFormData({...seatFormData, seat_number: e.target.value})} 
                                    />
                                </div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="border-0">
                            <Button variant="primary" type="submit" className="w-100 rounded-pill" disabled={submitting}>
                                {submitting ? "Processing..." : "Confirm & Add Seat"}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            </section>
        );
    }
    
    // Use only rows that have seats in database
    const rowLetters = availableRowLetters;

    return (
        <section className="container py-4">
            <div className="mb-4 d-flex justify-content-between align-items-center">
                <Button variant="light" onClick={() => router.back()} className="border rounded-pill px-3 shadow-sm">
                    <BsArrowLeft className="me-2" /> Back
                </Button>
                <h4 className="fw-bold mb-0">{hall?.name} - Layout Management</h4>
                <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)} className="rounded-pill px-3">
                    <BsPlusLg className="me-1" /> Add Seat
                </Button>
            </div>

            <div className="card shadow-lg border-0 rounded-4 p-5 mb-4 bg-[#0a0f1a] text-white">
                <div className="text-center mb-5">
                    <div className="mx-auto bg-info opacity-50 rounded-pill" style={{ width: "70%", height: "4px", boxShadow: "0 0 20px #0dcaf0" }} />
                    <small className="text-info d-block mt-2 tracking-widest">CINEMA SCREEN</small>
                </div>

                <div className="d-flex flex-column gap-3 align-items-center overflow-auto">
                    {rowLetters.map((rowLetter) => {
                        // Get only registered seat numbers for this row
                        const rowSeats = seats.filter(s => s.seat_row === rowLetter);
                        const seatNumbers = rowSeats.map(s => Number(s.seat_number)).sort((a, b) => a - b);
                        
                        return (
                            <div key={rowLetter} className="d-flex align-items-center gap-3">
                                <div className="text-secondary fw-bold" style={{ width: "30px" }}>{rowLetter}</div>
                                <div className="d-flex gap-2">
                                    {seatNumbers.map((seatNum) => {
                                        const seat = rowSeats.find(s => Number(s.seat_number) === seatNum);
                                        
                                        return (
                                            <button
                                                key={seatNum}
                                                onClick={() => { if(seat) { setActiveSeat(seat); setShowManageModal(true); } }}
                                                className={`btn p-0 d-flex flex-column align-items-center justify-content-center transition-all 
                                                    ${seat && seat.status === 1 ? 'btn-outline-info' : 'btn-secondary opacity-50'}`}
                                                style={{ width: "45px", height: "45px", borderRadius: "8px" }}
                                            >
                                                <MdEventSeat size={18} />
                                                <span style={{ fontSize: "10px", fontWeight: "bold", marginTop: "2px" }}>
                                                    {seat?.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MANAGEMENT MODAL */}
            <Modal show={showManageModal} onHide={() => setShowManageModal(false)} centered size="sm">
                <Modal.Body className="p-4 text-center">
                    <div className="mb-3 text-info"><MdEventSeat size={50} /></div>
                    <h5 className="fw-bold mb-1">Seat {activeSeat?.seat_row}{activeSeat?.seat_number}</h5>
                    <p className="text-muted small mb-4">{activeSeat?.seat_type} Class</p>
                    
                    <div className="d-grid gap-2">
                        <Button 
                            variant="outline-primary" 
                            className="rounded-3 py-2"
                            onClick={() => {
                                setEditSeatData({
                                    seat_row: activeSeat?.seat_row || "",
                                    seat_number: activeSeat?.seat_number?.toString() || "",
                                    seat_type: activeSeat?.seat_type || "Regular"
                                });
                                setShowEditModal(true);
                            }}
                        >
                            <BsPencilSquare className="me-2"/> Edit Seat
                        </Button>
                        <Button 
                            variant={activeSeat?.status === 1 ? "success" : "secondary"} 
                            className="rounded-3 py-2"
                            onClick={handleToggleSeat}
                            disabled={submitting}
                        >
                            {activeSeat?.status === 1 ? "✓ Available" : "⊘ Unavailable"}
                        </Button>
                        <Button variant="danger" className="rounded-3 py-2" onClick={handleDeleteSeat}>
                            <BsXCircleFill className="me-2"/> Delete Seat
                        </Button>
                        <Button variant="link" className="text-muted mt-2" onClick={() => setShowManageModal(false)}>Close</Button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* EDIT SEAT MODAL */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="sm">
                <Modal.Header closeButton><Modal.Title className="fw-bold">Edit Seat</Modal.Title></Modal.Header>
                <Modal.Body className="p-4">
                    <div className="row">
                        <div className="col-6 mb-3">
                            <Form.Label className="small fw-bold">Row (Letter)</Form.Label>
                            <Form.Control
                                type="text"
                                maxLength={1}
                                className="text-uppercase"
                                value={editSeatData.seat_row}
                                onChange={(e) => setEditSeatData({...editSeatData, seat_row: e.target.value.toUpperCase()})}
                                placeholder="e.g. A"
                                required
                            />
                        </div>
                        <div className="col-6 mb-3">
                            <Form.Label className="small fw-bold">Number</Form.Label>
                            <Form.Control
                                type="number"
                                value={editSeatData.seat_number}
                                onChange={(e) => setEditSeatData({...editSeatData, seat_number: e.target.value})}
                                placeholder="e.g. 2"
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <Form.Label className="small fw-bold">Type</Form.Label>
                        <Form.Control
                            as="select"
                            value={editSeatData.seat_type}
                            onChange={(e) => setEditSeatData({...editSeatData, seat_type: e.target.value})}
                        >
                            <option>Regular</option>
                            <option>VIP</option>
                        </Form.Control>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleEditLabel} disabled={submitting}>
                        {submitting ? "Updating..." : "Save Changes"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* CREATE MODAL */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
                <Form onSubmit={handleCreateSeat}>
                    <Modal.Header closeButton><Modal.Title className="fw-bold">Add Seat to Layout</Modal.Title></Modal.Header>
                    <Modal.Body className="p-4">
                        {/* Hall Name Display */}
                        <div className="mb-3 p-3 bg-light rounded-2">
                            <small className="text-muted d-block mb-1">Hall</small>
                            <h6 className="fw-bold mb-0">{hall?.name}</h6>
                        </div>

                        <div className="row">
                            <div className="col-6 mb-3">
                                <Form.Label className="small fw-bold">Row (Letter)</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    placeholder="e.g. A" 
                                    maxLength={1}
                                    className="text-uppercase"
                                    value={seatFormData.seat_row}
                                    required 
                                    onChange={e => setSeatFormData({...seatFormData, seat_row: e.target.value.toUpperCase()})} 
                                />
                            </div>
                            <div className="col-6 mb-3">
                                <Form.Label className="small fw-bold">Number</Form.Label>
                                <Form.Control 
                                    type="number" 
                                    placeholder="e.g. 1" 
                                    value={seatFormData.seat_number}
                                    required 
                                    onChange={e => setSeatFormData({...seatFormData, seat_number: e.target.value})} 
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <Form.Label className="small fw-bold">Type</Form.Label>
                            <Form.Control 
                                as="select"
                                value={seatFormData.seat_type}
                                onChange={e => setSeatFormData({...seatFormData, seat_type: e.target.value})}
                            >
                                <option>Regular</option>
                                <option>VIP</option>
                            </Form.Control>
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="border-0">
                        <Button variant="primary" type="submit" className="w-100 rounded-pill" disabled={submitting}>
                            {submitting ? "Processing..." : "Confirm & Add Seat"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </section>
    );
};

export default BookSeatsPage;