"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button } from "react-bootstrap";
import { BsArrowLeft, BsTrash } from "react-icons/bs";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { toast } from "react-toastify";
import PermissionGuard from "../../../../components/PermissionGuard";
// Project Imports - Going up 5 levels to reach src/app/components
import PageHeader from "../../../../components/page-header";
import Loading from "../../../../components/loading";

interface ProgramType {
  id: number;
  name: string;
  description: string;
  status: number;
  created_at?: string;
  updated_at?: string;
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

export default function ProgramTypeDetailsPage() {
  const params = useParams() as { id: string };
  const id = params?.id as string;
  const router = useRouter();
  const api = useMemo(() => getApiClientInstance(), []);

  const [programType, setProgramType] = useState<ProgramType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchProgramType = useCallback(async () => {
    try {
      if (!id) return;
      setLoading(true);
      const res = await api.get<ApiResponse<ProgramType>>(`/programs/show-programtype/${id}`);
      if (res.data?.success && res.data?.data) {
        setProgramType(res.data.data);
      } else {
        toast.error("Program Type not found");
      }
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.message || "Failed to load details");
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    if (id) fetchProgramType();
  }, [id, fetchProgramType]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this program type?")) return;

    try {
      setDeleting(true);
      const res = await api.delete<ApiResponse<null>>(`/programs/delete-programtype/${id}`);
      if (res.data?.success) {
        toast.success("Program type deleted successfully");
        router.push("/program/program-type-list"); 
      }
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loading />;

  if (!programType) {
    return (
      <div className="text-center py-5">
        <h4 className="text-danger">No data found</h4>
        <Button variant="primary" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <section className="container-fluid pt-3">
      <PageHeader title="PROGRAM TYPE DETAILS">
        <Button variant="outline-secondary" size="sm" onClick={() => router.back()}>
          <BsArrowLeft className="me-2" /> Back
        </Button>
      </PageHeader>

      <div className="mt-4 d-flex justify-content-center">
        <Card className="shadow-sm border-0 w-100" style={{ maxWidth: "800px" }}>
          <Card.Body className="p-4">
            <div className="row g-4">
              <div className="col-md-6">
                <label className="text-muted small fw-bold text-uppercase">Program Name</label>
                <p className="fs-5 fw-semibold border-bottom pb-2">{programType.name}</p>
              </div>

              <div className="col-md-6">
                <label className="text-muted small fw-bold text-uppercase">Status</label>
                <div>
                  <span className={`badge ${programType.status === 1 ? 'bg-success' : 'bg-danger'}`}>
                    {programType.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="col-12">
                <label className="text-muted small fw-bold text-uppercase">Description</label>
                <div className="p-3 bg-light rounded border">
                  {programType.description || "No description provided."}
                </div>
              </div>
            </div>
<PermissionGuard permission="Delete Program Type">
            <div className="mt-5 pt-3 border-top d-flex justify-content-end gap-2">
              <Button 
                variant="danger" 
                className="fw-bold d-flex align-items-center gap-2"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : <><BsTrash /> Delete Program Type</>}
              </Button>
            </div>
            </PermissionGuard>
          </Card.Body>
        </Card>
      </div>
    </section>
  );
}