"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Modal, Button } from "react-bootstrap";
import { useSearchParams, useRouter } from "next/navigation";
import { MdDelete, MdArrowBack, MdEdit, MdCloudUpload, MdToggleOn, MdToggleOff, MdClose } from "react-icons/md";
import { toast } from "react-toastify";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import  PermissionGuard  from "../../components/PermissionGuard";

interface AdvertisementDetail {
  id: number;
  title: string;
  description: string;
  trailer_url?: string;
  status?: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  images?: Array<{
    id: number;
    image_path: string;
    created_at: string;
  }>;
  user?: {
    id: number;
    name: string;
    phoneNo: string;
    address: string;
    email: string;
  };
}

interface DetailResponse {
  success: boolean;
  data: AdvertisementDetail;
  message: string;
}

export default function AdvertisementDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const advertisementId = searchParams?.get("id");

  const [advertisement, setAdvertisement] = useState<AdvertisementDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states for editing
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle and upload states
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedImg, setSelectedImg] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const fetchAdvertisement = async () => {
      if (!advertisementId) {
        setLoadError("Invalid advertisement ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);

      try {
        const api = getApiClientInstance();
        const response = await api.get<DetailResponse>(
          `/advertisements/show-advertisement/${advertisementId}`
        );

        if (response.data?.success) {
          setAdvertisement(response.data.data);
          setTitle(response.data.data.title);
          setDescription(response.data.data.description);
          setTrailerUrl(response.data.data.trailer_url || "");
        } else {
          setLoadError("Failed to load advertisement details");
        }
      } catch (error) {
        setLoadError("Unable to load advertisement. Please try again.");
        console.error("Error fetching advertisement:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvertisement();
  }, [advertisementId]);

  const handleUpdate = async () => {
    if (!title.trim()) return toast.error("Title is required");
    if (!advertisement) return;

    setIsSubmitting(true);
    try {
      const api = getApiClientInstance();
      const form = new FormData();
      form.append("title", title);
      form.append("description", description);
      form.append("trailer_url", trailerUrl);

      const res = await api.put(
        `/advertisements/update-advertisement/${advertisement.id}`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res?.data?.success || res?.status === 200) {
        toast.success("Updated successfully!");
        setIsEditing(false);        setShowEditModal(false);        // Refresh data
        const updated = await api.get<DetailResponse>(
          `/advertisements/show-advertisement/${advertisement.id}`
        );
        if (updated.data?.success) {
          setAdvertisement(updated.data.data);
          setTitle(updated.data.data.title);
          setDescription(updated.data.data.description);
          setTrailerUrl(updated.data.data.trailer_url || "");
        }
      } else {
        toast.error(res?.data?.message || "Update failed");
      }
    } catch (error) {
      toast.error("Update failed. Please try again.");
      console.error("Error updating advertisement:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!advertisement) return;
    if (!window.confirm("Are you sure you want to delete this advertisement?")) return;

    setIsDeleting(true);
    try {
      const api = getApiClientInstance();
      await api.delete(`/advertisements/delete-advertisement/${advertisement.id}`);
      toast.success("Deleted successfully!");
      setTimeout(() => router.push("/dashboard/video-gallery"), 1500);
    } catch (error) {
      toast.error("Delete failed. Please try again.");
      console.error("Error deleting advertisement:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!advertisement) return;

    setIsTogglingStatus(true);
    try {
      const api = getApiClientInstance();
      const response = await api.patch(`/advertisements/toggle-advertisement/${advertisement.id}`);

      if (response.data?.success) {
        toast.success(response.data?.message || "Status updated successfully!");
        // Refresh advertisement data
        const updated = await api.get<DetailResponse>(
          `/advertisements/show-advertisement/${advertisement.id}`
        );
        if (updated.data?.success) {
          setAdvertisement(updated.data.data);
        }
      } else {
        toast.error(response.data?.message || "Toggle failed");
      }
    } catch (error) {
      toast.error("Toggle failed. Please try again.");
      console.error("Error toggling advertisement:", error);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleUploadImage = async () => {
    if (!advertisement || !selectedImageFile) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploadingImage(true);
    try {
      const api = getApiClientInstance();
      const form = new FormData();
      form.append("advertisement_id", advertisement.id.toString());
      form.append("images", selectedImageFile);

      const response = await api.post(`/advertisements/upload-advertisement-images`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.success) {
        toast.success(response.data?.message || "Image uploaded successfully!");
        setSelectedImageFile(null);
        
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        // Refresh advertisement data to show newly uploaded image
        const updated = await api.get<DetailResponse>(
          `/advertisements/show-advertisement/${advertisement.id}`
        );
        if (updated.data?.success) {
          setAdvertisement(updated.data.data);
        }
      } else {
        toast.error(response.data?.message || "Upload failed");
      }
    } catch (error: unknown) {
      const apiErr = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg = apiErr.response?.data?.message || apiErr.message || "Upload failed. Please try again.";
      toast.error(errorMsg);
      console.error("Error uploading image:", apiErr);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!window.confirm("Delete this image?")) return;

    setDeletingImageId(imageId);
    try {
      const api = getApiClientInstance();
      const response = await api.delete(`/advertisements/remove-advertisement-image/${imageId}`);

      if (response.data?.success) {
        toast.success(response.data?.message || "Image deleted successfully!");
        // Refresh advertisement data
        const updated = await api.get<DetailResponse>(
          `/advertisements/show-advertisement/${advertisement?.id}`
        );
        if (updated.data?.success) {
          setAdvertisement(updated.data.data);
        }
      } else {
        toast.error(response.data?.message || "Delete failed");
      }
    } catch (error) {
      toast.error("Delete failed. Please try again.");
      console.error("Error deleting image:", error);
    } finally {
      setDeletingImageId(null);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return "";
    const baseUrl = "https://cinemaapi.kanocitymall.com.ng";
    
    if (path.startsWith("http")) return path;
    
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    return `${baseUrl}/${cleanPath}`;
  };

  const handleImageClick = (url: string) => {
    setSelectedImg(url);
    setShowModal(true);
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      const id = match && match[2] && match[2].length === 11 ? match[2] : null;
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : url;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "400px" }}>
          <div className="spinner-border text-danger" role="status"></div>
        </div>
      </div>
    );
  }

  if (loadError || !advertisement) {
    return (
      <div className="container-fluid py-4">
        <button className="btn btn-outline-secondary btn-sm mb-4" onClick={() => router.back()}>
          <MdArrowBack size={18} /> Back
        </button>
        <div className="alert alert-danger">{loadError || "Advertisement not found"}</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <button className="btn btn-outline-secondary btn-sm mb-4" onClick={() => router.back()}>
        <MdArrowBack size={18} /> Back
      </button>

      <div className="row gap-4">
        {/* Media Section */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "12px" }}>
            <div className="position-relative" style={{ paddingTop: "56.25%", background: "#000" }}>
              {advertisement.trailer_url ? (
                <iframe
                  src={getEmbedUrl(advertisement.trailer_url)}
                  className="position-absolute top-0 start-0 w-100 h-100"
                  frameBorder="0"
                  allowFullScreen
                />
              ) : (
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                  style={{ background: "#111", color: "#eee" }}
                >
                  <div className="text-center">No Video Preview</div>
                </div>
              )}
            </div>
          </div>

          {/* Images Gallery */}
          <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
            <div className="card-header bg-light border-0 p-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold">Images</h6>
              {advertisement.images && advertisement.images.length > 0 && (
                <span className="badge bg-primary">{advertisement.images.length}</span>
              )}
            </div>
            <div className="card-body p-3">
              {/* Upload Image Section */}
              <div className="mb-4 p-3 border-2 border-dashed rounded bg-light" style={{ borderColor: "#dee2e6" }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <MdCloudUpload size={20} className="text-primary" />
                  <label className="form-label small fw-bold mb-0">Upload New Image</label>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedImageFile(e.target.files?.[0] || null)}
                    className="form-control form-control-sm"
                    disabled={isUploadingImage}
                  />
                  <PermissionGuard permission="Delete User">
                  <button
                    className="btn btn-primary btn-sm d-flex align-items-center gap-2"
                    onClick={handleUploadImage}
                    disabled={!selectedImageFile || isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <>
                        <span 
                          className="spinner-border spinner-border-sm" 
                          role="status" 
                          aria-hidden="true"
                          style={{ width: "14px", height: "14px" }}
                        ></span>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <MdCloudUpload size={16} />
                        <span>Upload</span>
                      </>
                    )}
                  </button>
                  </PermissionGuard>
                </div>
                <small className="text-muted d-block mt-2">JPG, PNG or GIF (max 5MB)</small>
              </div>

              {/* Images List */}
              {advertisement.images && advertisement.images.length > 0 ? (
                <div className="row g-3">
                  {advertisement.images.map((img) => {
                    const url = getImageUrl(img.image_path);
                    return (
                      <div key={img.id} className="col-6 col-md-4 position-relative">
                        <div
                          className="position-relative gallery-card"
                          style={{ overflow: "hidden", borderRadius: "8px", height: 200 }}
                          onClick={() => handleImageClick(url)}
                        >
                          <Image
                            src={url}
                            alt="advertisement"
                            fill
                            unoptimized
                            sizes="(max-width: 768px) 50vw, 33vw"
                            style={{ objectFit: "cover" }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23eee%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2214%22%3EImage not found%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <div className="overlay d-flex align-items-center justify-content-center" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.2)' }}>
                            <span className="text-white small fw-bold">Click to Expand</span>
                          </div>
                          <PermissionGuard permission="Delete User">
                          <button
                            className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                            style={{ borderRadius: "50%", padding: "5px 8px", zIndex: 5 }}
                            onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }}
                            disabled={deletingImageId === img.id}
                            title="Delete image"
                          >
                            {deletingImageId === img.id ? <span className="spinner-border spinner-border-sm" /> : <MdClose size={18} />}
                          </button>
                          </PermissionGuard>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <p className="mb-0">No images yet. Upload one to get started!</p>
                </div>
              )}
            </div>
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
                <MdClose size={28} />
              </Button>
              {selectedImg && (
                <Image
                  src={selectedImg}
                  alt="Full View"
                  className="img-fluid"
                  width={1200}
                  height={800}
                  unoptimized
                  style={{ maxHeight: '90vh', objectFit: 'contain' }}
                />
              )}
            </Modal.Body>
          </Modal>

          {/* Edit Advertisement Modal */}
          <Modal show={showEditModal} onHide={() => { setShowEditModal(false); setTitle(advertisement?.title || ''); setDescription(advertisement?.description || ''); setTrailerUrl(advertisement?.trailer_url || ''); }} centered>
            <Modal.Header closeButton>
              <Modal.Title>Edit Advertisement</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="mb-3">
                <label className="form-label small fw-bold">Title</label>
                <input className="form-control form-control-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title..." />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Description</label>
                <textarea className="form-control form-control-sm" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description..." />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Trailer URL</label>
                <input className="form-control form-control-sm" value={trailerUrl} onChange={(e) => setTrailerUrl(e.target.value)} placeholder="YouTube link or embed URL" />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="light" onClick={() => { setShowEditModal(false); setTitle(advertisement?.title || ''); setDescription(advertisement?.description || ''); setTrailerUrl(advertisement?.trailer_url || ''); }}>Cancel</Button>
              <Button variant="warning" onClick={handleUpdate} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
            </Modal.Footer>
          </Modal>
        </div>

        {/* Details Section */}
        <div className="col-lg-4">
          {/* Main Info Card */}
          <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: "12px" }}>
            <div className="card-header bg-warning text-white p-3" style={{ borderRadius: "12px 12px 0 0" }}>
              <h5 className="mb-0 fw-bold">Details</h5>
            </div>
            <div className="card-body">
              {isEditing ? (
                <>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Title</label>
                    <input
                      className="form-control form-control-sm"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter title..."
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Description</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Short description..."
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Trailer URL</label>
                    <input
                      className="form-control form-control-sm"
                      value={trailerUrl}
                      onChange={(e) => setTrailerUrl(e.target.value)}
                      placeholder="YouTube link or embed URL"
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <PermissionGuard permission="Delete User">
                    <button
                      className="btn btn-light btn-sm border flex-grow-1"
                      onClick={() => {
                        setIsEditing(false);
                        setTitle(advertisement.title);
                        setDescription(advertisement.description);
                        setTrailerUrl(advertisement.trailer_url || "");
                      }}
                    >
                      Cancel
                    </button>
                    </PermissionGuard>
                    <PermissionGuard permission="Delete User">
                    <button
                      className="btn btn-warning btn-sm fw-bold flex-grow-1"
                      onClick={handleUpdate}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                    </PermissionGuard>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-3">
                    <label className="text-muted small d-block mb-1">Title</label>
                    <h6 className="mb-0 fw-bold">{advertisement.title}</h6>
                  </div>
                  <div className="mb-3">
                    <label className="text-muted small d-block mb-1">Description</label>
                    <p className="mb-0 small text-dark">{advertisement.description || "N/A"}</p>
                  </div>
                  <div className="mb-3">
                    <label className="text-muted small d-block mb-1">Trailer URL</label>
                    <p className="mb-0 small text-dark">
                      {advertisement.trailer_url ? (
                        <a href={advertisement.trailer_url} target="_blank" rel="noopener noreferrer" className="text-primary">
                          View Trailer
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <PermissionGuard permission="Delete User">
                    <button
                      className="btn btn-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                      onClick={() => setShowEditModal(true)}
                    >
                      <MdEdit size={16} /> Edit
                    </button>
                    </PermissionGuard>
                    <PermissionGuard permission="Delete User">
                    <button
                      className="btn btn-danger btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      <MdDelete size={16} /> {isDeleting ? "..." : "Delete"}
                    </button>
                    </PermissionGuard>
                  </div>

                  {/* Status and Toggle */}
                  <div className="mt-3 pt-3 border-top">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div>
                        <label className="text-muted small d-block mb-1">Status</label>
                        <div className="d-flex align-items-center gap-2">
                          <span className={`badge ${advertisement.status === 1 ? 'bg-success' : 'bg-secondary'}`}>
                            {advertisement.status === 1 ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <PermissionGuard permission="Delete User">
                      <button
                        className={`btn btn-sm d-flex align-items-center gap-2 ${advertisement.status === 1 ? 'btn-outline-warning' : 'btn-outline-success'}`}
                        onClick={handleToggleStatus}
                        disabled={isTogglingStatus}
                        title={`Click to ${advertisement.status === 1 ? 'deactivate' : 'activate'}`}
                      >
                        {isTogglingStatus ? (
                          <span className="spinner-border spinner-border-sm" />
                        ) : advertisement.status === 1 ? (
                          <>
                            <MdToggleOn size={18} /> Deactivate
                          </>
                        ) : (
                          <>
                            <MdToggleOff size={18} /> Activate
                          </>
                        )}
                      </button>
                      </PermissionGuard>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Creator Info Card */}
          {advertisement.user && (
            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-header bg-light border-0 p-3">
                <h6 className="mb-0 fw-bold">Creator Information</h6>
              </div>
              <div className="card-body small">
                <div className="mb-2">
                  <label className="text-muted d-block mb-1">Name</label>
                  <span className="fw-bold">{advertisement.user.name}</span>
                </div>
                <div className="mb-2">
                  <label className="text-muted d-block mb-1">Email</label>
                  <span className="fw-bold">{advertisement.user.email}</span>
                </div>
                <div className="mb-2">
                  <label className="text-muted d-block mb-1">Phone</label>
                  <span className="fw-bold">{advertisement.user.phoneNo}</span>
                </div>
                <div>
                  <label className="text-muted d-block mb-1">Address</label>
                  <span className="fw-bold">{advertisement.user.address}</span>
                </div>
              </div>
            </div>
          )}

          {/* Metadata Card */}
          <div className="card border-0 shadow-sm mt-3" style={{ borderRadius: "12px" }}>
            <div className="card-header bg-light border-0 p-3">
              <h6 className="mb-0 fw-bold">Metadata</h6>
            </div>
            <div className="card-body small">
              <div className="mb-2">
                <label className="text-muted d-block mb-1">Created</label>
                <span className="fw-bold">
                  {advertisement.created_at ? new Date(advertisement.created_at).toLocaleDateString() : "N/A"}
                </span>
              </div>
              <div>
                <label className="text-muted d-block mb-1">Last Updated</label>
                <span className="fw-bold">
                  {advertisement.updated_at ? new Date(advertisement.updated_at).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
