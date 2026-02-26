"use client";
import Image from 'next/image';
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Dropdown from "react-bootstrap/Dropdown";
import { 
    BsArrowLeft, BsThreeDotsVertical, BsTrash, BsCloudUpload, 
    BsPeople, BsGrid3X3Gap, BsXCircleFill
} from "react-icons/bs";
import { Spinner } from "react-bootstrap";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import Loading from "../../../../components/loading";
import { toast } from "react-toastify";
import CreateHallForm from "../../components/CreateHallForm";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import PermissionGuard from "../../../../components/PermissionGuard";

// --- Interfaces ---
export interface HallImage {
    id: number;
    image_path: string;
}

export interface Hall {
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
    images: HallImage[];
}

export interface Seat {
    id: number;
    hall_id: number;
    seat_row: string;
    seat_number: number;
    label: string;
    seat_type: string;
    status: number;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://halls.kanocitymall.com.ng";

const HallDetailsPage = () => {
    const { id } = useParams();
    const router = useRouter();
    const authUser = useSelector((state: RootState) => state.auth.main.user);
    const isSuperAdmin = authUser?.role?.name?.toLowerCase().includes("admin");

    const [hall, setHall] = useState<Hall | null>(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [refetch, setRefetch] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const api = useMemo(() => getApiClientInstance(), []);

    const fetchHallDetails = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await api.get<{ data: Hall }>(`/halls/get-hall/${id}`);
            if (res.data?.data) {
                setHall(res.data.data);
            }
        } catch {
            toast.error("Failed to fetch hall details");
        } finally {
            setLoading(false);
        }
    }, [id, api]);

    useEffect(() => {
        fetchHallDetails();
        if (refetch) setRefetch(false);
    }, [fetchHallDetails, refetch]);

    const toggleHallStatus = async () => {
        if (!id) return;
        try {
            setToggling(true);
            const res = await api.patch(`/halls/toggle-hall/${id}`);
            toast.success(res.data?.message || "Status updated");
            await fetchHallDetails();
        } catch {
            toast.error("Failed to update status");
        } finally {
            setToggling(false);
        }
    };

    const deleteHall = async () => {
        if (!id || !hall) return;
        if (!confirm(`Are you sure you want to delete "${hall.name}"?`)) return;
        try {
            setLoading(true);
            await api.delete(`/halls/delete-hall/${id}`);
            toast.success("Hall deleted successfully");
            router.push("/hall/hall-list");
        } catch {
            toast.error("Failed to delete hall");
            setLoading(false);
        }
    };

    const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!id || !files || files.length === 0) return;

        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append("images[]", file));

        try {
            setUploading(true);
            await api.post(`/halls/upload-images/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Images uploaded successfully");
            await fetchHallDetails();
        } catch {
            toast.error("Upload failed");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    // New Delete Image Function
    const handleDeleteImage = async (imageId: number) => {
        if (!confirm("Are you sure you want to delete this image?")) return;
        try {
            await api.delete(`/halls/delete-image/${id}/${imageId}`);
            toast.success("Image deleted");
            // Reset index to 0 to avoid out-of-bounds error if current image is deleted
            setSelectedImageIndex(0);
            await fetchHallDetails();
        } catch {
            toast.error("Failed to delete image");
        }
    };

    if (loading) return <Loading />;
    if (!hall) return <div className="text-center mt-5"><h5>Hall not found.</h5></div>;

    return (
        <section className="container py-4">
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden p-4">
                <div className="row g-4 align-items-start">
                    {/* Left Side: Images */}
                    <div className="col-md-6">
                        <div className="mb-3 position-relative" style={{ height: "400px" }}>
                            <Image
                                src={hall.images[selectedImageIndex]?.image_path ? `${BASE_URL}/${hall.images[selectedImageIndex].image_path}` : "/no-image.jpg"}
                                alt={hall.name}
                                fill
                                unoptimized
                                className="rounded-4 shadow-sm"
                                style={{ objectFit: "cover" }}
                            />
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                            {hall.images.map((img, idx) => (
                                <div 
                                    key={img.id} 
                                    className="position-relative"
                                    style={{ width: "80px", height: "60px", cursor: 'pointer' }}
                                >
                                    <Image 
                                        src={`${BASE_URL}/${img.image_path}`} 
                                        className={`w-100 h-100 rounded-2 border ${selectedImageIndex === idx ? 'border-primary border-2' : ''}`} 
                                        style={{ objectFit: 'cover' }} 
                                        alt="hall thumbnail"
                                        width={80}
                                        height={60}
                                        onClick={() => setSelectedImageIndex(idx)}
                                    />
                                    
                                    {/* Delete Image Icon */}
                                    <PermissionGuard permission="Manage Halls">
                                        <BsXCircleFill 
                                            className="position-absolute text-danger bg-white rounded-circle"
                                            style={{ top: "-5px", right: "-5px", fontSize: "1.2rem", zIndex: 10 }}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent triggering setSelectedImageIndex
                                                handleDeleteImage(img.id);
                                            }}
                                        />
                                    </PermissionGuard>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Details */}
                    <div className="col-md-6 ps-md-5">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <Button variant="light" onClick={() => router.back()} className="rounded-pill px-3">
                                <BsArrowLeft className="me-2" /> Back
                            </Button>

                            <Dropdown align="end">
                                <Dropdown.Toggle variant="light" className="p-2 border rounded-circle">
                                    <BsThreeDotsVertical />
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="shadow border-0 p-2">
                                    <PermissionGuard permission="Edit Hall">
                                        <Dropdown.Item onClick={() => setShowEditModal(true)}>Edit Hall</Dropdown.Item>
                                    </PermissionGuard>

                                    <PermissionGuard permission="Toggle Hall">
                                        <div className="dropdown-item d-flex align-items-center justify-content-between">
                                            <span>{hall.status === 1 ? "Active" : "Inactive"}</span>
                                            <Form.Check 
                                                type="switch"
                                                id="status-switch"
                                                checked={hall.status === 1}
                                                onChange={toggleHallStatus}
                                                disabled={toggling}
                                                className="ms-3"
                                            />
                                        </div>
                                    </PermissionGuard>

                                    <PermissionGuard permission="Manage Halls">
                                        <Dropdown.Item
                                          as="label"
                                          htmlFor="file-upload"
                                          style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
                                          className={uploading ? 'disabled' : ''}
                                        >
                                          {uploading ? (
                                            <><Spinner animation="border" size="sm" className="me-2" />Uploading...</>
                                          ) : (
                                            <><BsCloudUpload className="me-2" /> Upload Photos</>
                                          )}
                                          <input type="file" id="file-upload" hidden multiple onChange={handleUploadImages} disabled={uploading} />
                                        </Dropdown.Item>
                                    </PermissionGuard>

                                    <Dropdown.Divider />

                                    {isSuperAdmin && (
                                        <PermissionGuard permission="Delete Hall">
                                            <Dropdown.Item onClick={deleteHall} className="text-danger">
                                                <BsTrash className="me-2" /> Delete Hall
                                            </Dropdown.Item>
                                        </PermissionGuard>
                                    )}
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>

                        {/* Status Badge & Name */}
                        <div className="mb-3">
                            <span className={`badge rounded-pill px-3 py-2 mb-2 ${hall.status === 1 ? "bg-success" : "bg-danger"}`}>
                                {hall.status === 1 ? "● ACTIVE" : "● INACTIVE"}
                            </span>
                            <h2 className="fw-bold display-6">{hall.name}</h2>
                            <code className="text-muted">{hall.code}</code>
                        </div>

                        <hr className="my-4" />

                        <div className="row g-3 mb-4">
                            <div className="col-6">
                                <div className="p-3 border rounded-3 bg-light">
                                    <small className="text-muted d-block"><BsPeople className="me-1" /> Capacity</small>
                                    <span className="fw-bold fs-5">{hall.total_seats} Seats</span>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="p-3 border rounded-3 bg-light">
                                    <small className="text-muted d-block"><BsGrid3X3Gap className="me-1" /> Layout</small>
                                    <span className="fw-bold fs-5">{hall.seat_layout || "Standard"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="fw-bold text-muted small text-uppercase">Description</label>
                            <p className="mt-1">{hall.details || "No details available."}</p>
                        </div>

                        {/* Starting Price section removed to fix NaN display and layout */}
                        <PermissionGuard permission="Show Seat">
                        <div className="mt-auto">
                            <Button 
                                variant="warning" 
                                className="btn btn-warning d-flex align-items-center gap-2 text-nowrap"
                                disabled={hall.status !== 1}
                                onClick={() => router.push(`/hall/hall-list/details/${id}/book-seats`)}
                            >
                                {hall.status === 1 ? "View Seats" : "Currently Unavailable"}
                            </Button>
                        </div>
                        </PermissionGuard>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
                <Modal.Header closeButton><Modal.Title className="fw-bold">Update Hall Details</Modal.Title></Modal.Header>
                <Modal.Body>
                    <CreateHallForm hallId={Number(id)} setRefetch={setRefetch} onClose={() => setShowEditModal(false)} />
                </Modal.Body>
            </Modal>
        </section>
    );
};

export default HallDetailsPage;

