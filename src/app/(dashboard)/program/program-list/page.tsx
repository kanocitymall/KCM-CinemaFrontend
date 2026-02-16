"use client";

import { MdAdd } from "react-icons/md";
import Link from "next/link";
import { Modal } from "react-bootstrap";
import { useEffect, useState, useMemo, useCallback } from "react";
import { FaRegEdit } from "react-icons/fa";
import { toast } from "react-toastify";

// Project Imports
import ProgramForm from "./components/program-form"; // Ensure this component name is updated
import PageHeader from "../../components/page-header";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import Loading from "../../components/loading";
import PermissionGuard from "../../components/PermissionGuard";

interface Program {
  id: number;
  program_type_id?: number;
  title: string;
  program_type?: {
    name: string;
  };
  duration?: string;
  status: number;
  created_at?: string;
  updated_at?: string;
}

interface PaginationData {
  data: Program[];
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

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const Programs = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetch, setRefetch] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  const api = useMemo(() => getApiClientInstance(), []);

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProgram(null);
  };

  // API: fetch programs
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<ApiResponse<PaginationData>>(`/programs?page=${currentPage}`);
      if (res.data?.success) {
        setPrograms(res.data.data.data);
        setPagination(res.data.data);
      }
    } catch (err: unknown) {
      console.error("❌ Failed to load programs", err);
      setPrograms([]);
    } finally {
      setLoading(false);
      setRefetch(false);
    }
  }, [api, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData, refetch]);

  // API: update program status
  const updateProgramStatus = async (program: Program) => {
    const prevPrograms = [...programs];
    const isCurrentlyActive = program.status === 1;
    const newStatus = isCurrentlyActive ? 0 : 1;

    setPrograms((prev) =>
      prev.map((p) =>
        p.id === program.id ? { ...p, status: newStatus } : p
      )
    );
    setUpdatingId(program.id);

    try {
      await api.patch(`/programs/toggle-program/${program.id}`, {
        status: newStatus,
      });
      toast.success("Status updated");
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error("❌ Failed to update status", err);
      setPrograms(prevPrograms);
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section>
      <PageHeader title="PROGRAMS">
        <div className="d-flex gap-2 align-items-center">
          <input
            type="search"
            className="form-control tw-text-sm d-none d-md-block"
            placeholder="Search programs..."
          />
          <PermissionGuard permission="Create Program">
            <button
              className="btn btn-warning d-flex align-items-center gap-2 text-nowrap fw-bold"
              onClick={() => {
                setSelectedProgram(null);
                setShowModal(true);
              }}
            >
              <MdAdd /> Add Program
            </button>
          </PermissionGuard>
        </div>
      </PageHeader>

      {loading ? (
        <Loading />
      ) : (
        <section className="pt-4">
          <div className="table-responsive mt-4">
            <table className="table table-sm align-middle" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <PermissionGuard permission="Edit Program"><th>Action</th></PermissionGuard>
                  <PermissionGuard permission="Show Booking"><th className="text-center">Details</th></PermissionGuard>
                </tr>
              </thead>
              <tbody>
                {programs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">No programs found</td>
                  </tr>
                ) : (
                  programs.map((p, i) => {
                    const isActive = p.status === 1;
                    return (
                      <tr key={p.id}>
                        <td>{((currentPage - 1) * (pagination?.per_page || 0)) + (i + 1)}</td>
                        <td className="fw-bold">{p.title}</td>
                        <td>
                            <span className="badge bg-info text-dark">
                                {p.program_type?.name || "N/A"}
                            </span>
                        </td>
                        <td>{p.duration}</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={isActive}
                              disabled={updatingId === p.id}
                              onChange={() => updateProgramStatus(p)}
                              style={{ cursor: 'pointer' }}
                            />
                            <small className={isActive ? "text-success ms-1" : "text-danger ms-1"}>
                              {isActive ? "Active" : "Inactive"}
                            </small>
                          </div>
                        </td>
                        <PermissionGuard permission="Edit Program">
                        <td className="d-flex gap-2">
                          
                            <button
                              className="btn btn-primary d-flex align-items-center gap-2"
                              onClick={() => {
                                setSelectedProgram(p);
                                setShowModal(true);
                              }}
                            >
                              <FaRegEdit /> 
                               Edit
                            </button>
                        </td>
                         </PermissionGuard>
                          <PermissionGuard permission="Show Booking">
                       <td className="text-center">
                          <Link
                            href={`/program/program-list/details/${p.id}`}
                            className="btn btn-sm btn-outline-success px-3"
                          >
                            Details
                          </Link>
                        </td>
                        </PermissionGuard>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pagination && (pagination.last_page ?? 1) > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 border-top pt-3">
              <span className="text-muted small">
                Showing {programs.length} of {pagination.total} items
              </span>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  Prev
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={currentPage === (pagination.last_page ?? 1)}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="h6">{selectedProgram ? "Edit" : "Add"} Program</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ProgramForm 
            program={selectedProgram} 
            setRefetch={setRefetch} 
            onClose={handleCloseModal}
          />
        </Modal.Body>
      </Modal>
    </section>
  );
};

export default Programs;