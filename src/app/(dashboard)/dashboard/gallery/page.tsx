"use client";
import React, { useState, useEffect, useCallback } from "react";
import { MdPhoto, MdArrowBack, MdCloudUpload, MdVideoLibrary } from "react-icons/md";
import Modal from "react-bootstrap/Modal";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import PermissionGuard from "../../components/PermissionGuard";

const NEW_PRIMARY_COLOR = "#aa1c2aff";
const LIGHT_PRIMARY_COLOR = "rgba(170, 28, 42, 0.15)";
const BASE_IMAGE_URL = "https://halls.kanocitymall.com.ng";

interface GalleryImage {
  id: number;
  path: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

interface GalleryResponse {
  success: boolean;
  data: {
    current_page: number;
    data: GalleryImage[];
    last_page: number;
    total: number;
  };
  message: string;
}

export default function GalleryPage() {
  const router = useRouter();
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  // FIXED: Wrapped in useCallback to resolve dependency warning
  const fetchGalleryImages = useCallback(async () => {
    setLoadingGallery(true);
    try {
      const api = getApiClientInstance();
      const res = await api.get<GalleryResponse>(`/gallery/view-images?page=${currentPage}&limit=15`);
      
      if (res?.data?.success) {
        const pageData = res.data.data;
        setGalleryImages(pageData.data || []);
        setLastPage(pageData.last_page || 1);
      } else {
        toast.error("Failed to load gallery images");
        setGalleryImages([]);
      }
    } catch (err) {
      console.error("Failed to fetch gallery images:", err);
      toast.error("Failed to load gallery images");
      setGalleryImages([]);
    } finally {
      setLoadingGallery(false);
    }
  }, [currentPage]);

  // FIXED: fetchGalleryImages is now a stable dependency
  useEffect(() => {
    fetchGalleryImages();
  }, [fetchGalleryImages]);

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) return toast.error("Please select at least one image");

    setUploadingImage(true);
    try {
      const api = getApiClientInstance();
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("images[]", file);
      });

      const res = await api.post("/gallery/add-images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res?.status === 200 || res?.data?.success) {
        toast.success("Images uploaded successfully");
        setSelectedFiles([]);
        setCurrentPage(1);
        fetchGalleryImages();
        const fileInput = document.getElementById("gallery-file-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      }
    } catch (err: unknown) {
      const message = (() => {
        if (err instanceof Error) return err.message;
        try {
          const e = err as { response?: { data?: { message?: string } } };
          return e.response?.data?.message || String(e);
        } catch {
          return String(err);
        }
      })();
      toast.error(message || "Failed to upload images");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;

    setDeletingImageId(imageId);
    try {
      const api = getApiClientInstance();
      const res = await api.delete(`/gallery/delete-gallery-image/${imageId}`);
      if (res?.status === 200 || res?.data?.success) {
        toast.success("Image deleted successfully");
        fetchGalleryImages();
      }
    } catch (err: unknown) {
      const message = (() => {
        if (err instanceof Error) return err.message;
        try {
          const e = err as { response?: { data?: { message?: string } } };
          return e.response?.data?.message || String(e);
        } catch {
          return String(err);
        }
      })();
      toast.error(message || "Failed to delete image");
    } finally {
      setDeletingImageId(null);
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => router.back()}>
          <MdArrowBack size={18} /> Back
        </button>
        <h1 className="mb-0 text-warning d-none d-md-block fw-bold">Image Gallery</h1>
        <div className="d-flex align-items-center gap-2">
          <PermissionGuard permission="Add Gallery Image">
            <button
              className="btn btn-warning btn-sm d-flex align-items-center gap-2 fw-bold"
              onClick={() => document.getElementById('gallery-file-input')?.click()}
              disabled={uploadingImage}
            >
              <MdCloudUpload size={18} /> Upload Images
            </button>
          </PermissionGuard>
          <PermissionGuard permission="Add Gallery Video">
            <button className="btn btn-info btn-sm fw-bold" onClick={() => router.push('/dashboard/video-gallery')}>
              <MdVideoLibrary size={18} /> Videos
            </button>
          </PermissionGuard>
        </div>
      </div>

      <input type="file" id="gallery-file-input" multiple accept="image/*" onChange={handleImageFileSelect} style={{ display: 'none' }} />

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="alert mb-4" style={{ backgroundColor: LIGHT_PRIMARY_COLOR, borderLeft: `4px solid ${NEW_PRIMARY_COLOR}` }}>
          <div className="d-flex justify-content-between align-items-center">
            <span><strong>{selectedFiles.length}</strong> files selected</span>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-light border" onClick={() => setSelectedFiles([])}>Cancel</button>
              <button className="btn btn-sm btn-danger fw-bold" onClick={handleUploadImages} disabled={uploadingImage}>
                {uploadingImage ? "Uploading..." : "Start Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
        <div className="card-body p-4">
          {loadingGallery ? (
            <div className="text-center p-5"><div className="spinner-border text-danger" role="status"></div></div>
          ) : galleryImages.length === 0 ? (
            <div className="text-center p-5">
              <MdPhoto size={60} color="#ccc" />
              <p className="text-muted mt-2">No images found.</p>
            </div>
          ) : (
            <div className="row g-3">
              {galleryImages.map((image, idx) => (
                  <div key={image.id} className="col-6 col-md-4 col-lg-3">
                  <div className="position-relative rounded overflow-hidden shadow-sm" style={{ height: '200px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${BASE_IMAGE_URL}/${image.path}`}
                      alt="Gallery Item"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => { setActiveImageIndex(idx); setShowImageModal(true); }}
                      onError={(e) => {
                        console.warn('Image failed to load:', (e.target as HTMLImageElement).src);
                      }}
                    />
                    
                    <PermissionGuard permission="Delete Gallery Image">
                      <button 
                        className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: '30px', height: '30px', opacity: 0.9 }}
                        onClick={() => handleDeleteImage(image.id)}
                        disabled={deletingImageId === image.id}
                      >
                        {deletingImageId === image.id ? '...' : '×'}
                      </button>
                    </PermissionGuard>

                    <div className="position-absolute bottom-0 w-100 p-2 bg-dark bg-opacity-50 text-white small" style={{ fontSize: '10px' }}>
                      {new Date(image.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Image viewer modal */}
          <Modal show={showImageModal} onHide={() => setShowImageModal(false)} fullscreen centered>
            <Modal.Header closeButton>
              <Modal.Title>Image Preview</Modal.Title>
            </Modal.Header>
            <Modal.Body className="d-flex align-items-center justify-content-center p-0" style={{ background: '#000' }}>
              {activeImageIndex !== null && galleryImages[activeImageIndex] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${BASE_IMAGE_URL}/${galleryImages[activeImageIndex].path}`}
                  alt={`Image ${activeImageIndex + 1}`}
                  style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 140px)', objectFit: 'contain' }}
                />
              ) : (
                <div className="text-white">No image</div>
              )}
            </Modal.Body>
            <Modal.Footer className="d-flex justify-content-between">
              <div>
                <button className="btn btn-outline-light me-2" onClick={() => {
                  setActiveImageIndex((i) => {
                    const cur = (i === null) ? 0 : i;
                    return galleryImages.length ? (cur - 1 + galleryImages.length) % galleryImages.length : 0;
                  });
                }}>&larr; Prev</button>
                <button className="btn btn-outline-light" onClick={() => {
                  setActiveImageIndex((i) => {
                    const cur = (i === null) ? 0 : i;
                    return galleryImages.length ? (cur + 1) % galleryImages.length : 0;
                  });
                }}>Next &rarr;</button>
              </div>
              <div className="text-muted">{activeImageIndex !== null ? activeImageIndex + 1 : 0} / {galleryImages.length}</div>
            </Modal.Footer>
          </Modal>

          {/* Pagination */}
          {lastPage > 1 && (
            <nav className="mt-4 d-flex justify-content-center">
              <ul className="pagination pagination-sm">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Prev</button>
                </li>
                {[...Array(lastPage)].map((_, i) => (
                  <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(i + 1)}
                      style={currentPage === i + 1 ? { backgroundColor: NEW_PRIMARY_COLOR, borderColor: NEW_PRIMARY_COLOR } : {}}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === lastPage ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))}>Next</button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}