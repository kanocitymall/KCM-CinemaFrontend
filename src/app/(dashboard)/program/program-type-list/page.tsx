"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MdAdd } from "react-icons/md";
import { Modal } from "react-bootstrap";
import { FaRegEdit } from "react-icons/fa";
import { toast } from "react-toastify";

// Project Imports
import ProgramForm from "./components/program-form";
import PageHeader from "../../components/page-header";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import Loading from "../../components/loading";
import PermissionGuard from "../../components/PermissionGuard";

// --- 1. Interfaces ---
export interface ProgramType {
  id: number;
  name: string;
  description: string;
  status: number;
  created_at?: string;
  updated_at?: string;
}

interface PaginationData {
  data: ProgramType[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const ProgramTypesPage = () => {
  const router = useRouter(); 
  
  const [programTypes, setProgramTypes] = useState<ProgramType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refetch, setRefetch] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<ProgramType | null>(null);
  
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationData | null>(null);

  const api = useMemo(() => getApiClientInstance(), []);

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedType(null);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<ApiResponse<PaginationData>>(
        `/programs/programtypes?page=${currentPage}&t=${Date.now()}`
      );
      
      if (res.data?.success) {
        setProgramTypes(res.data.data.data);
        setPaginationInfo(res.data.data);
      }
    } catch (err: unknown) {
      console.error("❌ Failed to load program types", err);
      toast.error("Failed to fetch data from server");
    } finally {
      setLoading(false);
      setRefetch(false);
    }
  }, [api, currentPage]);

  useEffect(() => {
    loadData();
  }, [refetch, loadData, currentPage]);

  const toggleStatus = async (item: ProgramType) => {
    const isCurrentlyActive = item.status === 1;
    const newStatus = isCurrentlyActive ? 0 : 1;

    setProgramTypes(prev =>
      prev.map((s) => (s.id === item.id ? { ...s, status: newStatus } : s))
    );
    setUpdatingId(item.id);

    try {
      await api.patch(`/programs/toggle-programtype/${item.id}`, { status: newStatus });
      toast.success(`${item.name} status updated`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to update status");
      setRefetch(true); 
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="container-fluid pt-3">
      <style jsx>{`
        .btn-detail-custom {
          color: #198754;
          border: 1px solid #198754;
          background: transparent;
          transition: all 0.3s ease;
        }
        .btn-detail-custom:hover {
          background-color: #198754 !important;
          color: white !important;
        }
        .form-check-input:checked {
          background-color: #198754 !important;
          border-color: #198754 !important;
        }
        .form-check-input {
          background-color: #dc3545 !important;
          border-color: #dc3545 !important;
          cursor: pointer;
        }
      `}</style>

      <PageHeader title="Create Program Type">
        <div className="d-flex gap-2 align-items-center">
          <input type="search" className="form-control d-none d-md-block" placeholder="Search..." />
          <PermissionGuard permission="Create Program Type">
            <button className="btn btn-warning d-flex align-items-center gap-2 text-nowrap fw-bold" onClick={() => setShowModal(true)}>
              <MdAdd /> Add Type
            </button>
          </PermissionGuard>
        </div>
      </PageHeader>

      {loading ? <Loading /> : (
        <div className="mt-4 card border-0 shadow-sm p-3">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "50px" }}>S/N</th>
                  <th>Name</th>
                  <th>Description</th>
                  <PermissionGuard permission="Toggle Program Type"><th className="text-center">Status</th></PermissionGuard>
                 <PermissionGuard permission="Show Program Type"><th className="text-center">Actions</th></PermissionGuard>
                  <PermissionGuard permission="Edit Program Type"><th className="text-center">View</th></PermissionGuard>
                </tr>
              </thead>
              <tbody>
                {programTypes.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-5">No records found</td></tr>
                ) : (
                  programTypes.map((item, index) => {
                    const isActive = item.status === 1;
                    return (
                      <tr key={item.id}>
                        <td>{((currentPage - 1) * (paginationInfo?.per_page || 10)) + (index + 1)}</td>
                        <td className="fw-semibold">{item.name}</td>
                        <td className="text-muted small text-truncate" style={{ maxWidth: "250px" }}>{item.description}</td>
                        <PermissionGuard permission="Toggle Program Type">
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={isActive}
                              disabled={updatingId === item.id}
                              onChange={() => toggleStatus(item)}
                            />
                          </div>
                        </td>
                        </PermissionGuard>
                        <PermissionGuard permission="Edit Program Type">
                        <td className="d-flex gap-2">
                            <button 
                              className="btn btn-primary d-flex align-items-center gap-2"
                              onClick={() => { setSelectedType(item); setShowModal(true); }}
                            >
                              <FaRegEdit />
                              Edit
                            </button>
                        </td>
                        </PermissionGuard>
 <PermissionGuard permission="Show Program Type">
                        <td className="text-center">
                          {/* Route set to /details/[id] per your request */}
                          <button 
                            className="btn btn-sm btn-detail-custom px-3 fw-medium" 
                            onClick={() => router.push(`/program/program-type-list/details/${item.id}`)}
                          >
                            Detail
                          </button>
                        </td>
                        </PermissionGuard>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {paginationInfo && (paginationInfo.last_page ?? 1) > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 border-top pt-3">
              <span className="text-muted small">
                Showing {programTypes.length} of {paginationInfo.total} items
              </span>
              <div className="d-flex gap-1">
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Previous
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  disabled={currentPage === paginationInfo.last_page}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6">{selectedType ? "Edit" : "Add"} Program Type</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ProgramForm serviceType={selectedType} setRefetch={setRefetch} onClose={handleCloseModal} />
        </Modal.Body>
      </Modal>
    </section>
  );
};

export default ProgramTypesPage;