"use client";
import React, { useState, useEffect, useCallback } from "react";
import { MdArrowBack, MdCloudUpload } from "react-icons/md";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";


interface Advertisement {
  id: number;
  title: string;
  description: string;
  trailer_url?: string;
  created_at?: string;
  user?: { id: number; name?: string; email?: string; phoneNo?: string };
}

interface AdvertResponse {
  data: {
    data: Advertisement[];
    current_page: number;
    last_page: number;
  };
  message: string;
  success: boolean;
}

export default function AdvertisementsPage() {
  const router = useRouter();
  const [adverts, setAdverts] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Advertisement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");

  const fetchAdverts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const api = getApiClientInstance();
      const res = await api.get<AdvertResponse>(`/advertisements?page=${currentPage}&limit=12`);
      setAdverts(res?.data?.data?.data || []);
      setLastPage(res?.data?.data?.last_page || 1);
    } catch {
      setAdverts([]);
      setLoadError("Unable to load advertisements");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchAdverts();
  }, [fetchAdverts]);

  const openAddForm = () => {
    setSelected(null);
    setTitle("");
    setDescription("");
    setTrailerUrl("");
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("Title is required");
    setIsSubmitting(true);
    try {
      const api = getApiClientInstance();
      const form = new FormData();
      form.append("title", title ?? "");
      form.append("description", description ?? "");
      form.append("trailer_url", trailerUrl ?? "");

      const res = selected
        ? await api.put(`/advertisements/update-advertisement/${selected.id}`, form, { headers: { "Content-Type": "multipart/form-data" } })
        : await api.post(`/advertisements/create-advertisement`, form, { headers: { "Content-Type": "multipart/form-data" } });

      if (res?.data?.success || res?.status === 200) {
        toast.success(selected ? "Updated!" : "Added!");
        setShowForm(false);
        fetchAdverts();
      } else {
        toast.error(res?.data?.message || "Operation failed");
      }
    } catch {
      toast.error("Operation failed");
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => router.back()}>
          <MdArrowBack size={18} /> Back
        </button>
        <h1 className="mb-0 text-warning d-none d-md-block fw-bold">Advertisements</h1>
        <div className="d-flex align-items-center gap-2">
          {/* <PermissionGuard permission="Add Advertisements"> */}
            <button className="btn btn-warning btn-sm d-flex align-items-center gap-2 fw-bold" onClick={openAddForm}>
              <MdCloudUpload size={18} /> Add Advertisement
            </button>
          {/* </PermissionGuard> */}
        </div>
      </div>

      <div className="row g-4">
        {loading ? (
          <div className="text-center p-5 w-100"><div className="spinner-border text-danger" role="status"></div></div>
        ) : loadError ? (
          <div className="text-center p-5 w-100">
            <div className="mb-3" style={{ fontSize: 60, color: '#ccc' }}>📺</div>
            <p className="text-muted mb-0">No advertisements yet. Add your first advertisement to get started!</p>
          </div>
        ) : adverts.length === 0 ? (
          <div className="text-center p-5 w-100">
            <div className="mb-3" style={{ fontSize: 60, color: '#ccc' }}>📺</div>
            <p className="text-muted mb-0">No advertisements yet. Add your first advertisement to get started!</p>
          </div>
        ) : adverts.map((ad) => (
          <div key={ad.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
            <div className="card h-100 shadow-sm border-0 overflow-hidden position-relative" style={{ borderRadius: '12px' }}>
              <div className="position-relative" style={{ paddingTop: '56.25%', background: '#000' }}>
                {ad.trailer_url ? (
                  <iframe src={getEmbedUrl(ad.trailer_url)} className="position-absolute top-0 start-0 w-100 h-100" frameBorder="0" allowFullScreen />
                ) : (
                  <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: '#111', color: '#eee' }}>
                    <div className="text-center">No Preview</div>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h6 className="fw-bold mb-1 text-truncate">{ad.title}</h6>
                <small className="text-muted d-block text-truncate" style={{ fontSize: '12px' }}>{ad.description}</small>
                <div className="d-flex gap-2 mt-3">
                  <button 
                    className="btn btn-success btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1" 
                    onClick={() => router.push(`/dashboard/advertisement?id=${ad.id}`)} 
                    title="View advertisement details"
                  >
                     View
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {adverts.length > 0 && (
        <div className="d-flex justify-content-center align-items-center gap-2 mt-5 mb-3">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>Previous</button>
          <div className="px-3 py-2 bg-light rounded"><small className="fw-bold">Page {currentPage} of {lastPage}</small></div>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setCurrentPage(prev => Math.min(lastPage, prev + 1))} disabled={currentPage === lastPage}>Next</button>
        </div>
      )}

      {showForm && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header bg-warning text-white">
                  <h5 className="modal-title fw-bold">{selected ? "Update Advertisement" : "Add Advertisement"}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowForm(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Title *</label>
                    <input className="form-control form-control-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title..." />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Description</label>
                    <textarea className="form-control form-control-sm" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description..." />
                  </div>
                  <div className="mb-1">
                    <label className="form-label small fw-bold">Trailer URL</label>
                    <input className="form-control form-control-sm" value={trailerUrl} onChange={(e) => setTrailerUrl(e.target.value)} placeholder="YouTube link or embed URL" />
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button className="btn btn-sm btn-light border" onClick={() => setShowForm(false)}>Cancel</button>
                  <button className="btn btn-sm btn-warning fw-bold px-4" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Saving..." : selected ? "Update Changes" : "Save Advertisement"}</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}