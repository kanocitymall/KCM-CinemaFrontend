"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Spinner } from "react-bootstrap";
import { BsArrowLeft, BsTrash, BsActivity } from "react-icons/bs";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { toast } from "react-toastify";
import PermissionGuard from "../../../../components/PermissionGuard";

interface User {
  id: number;
  name: string;
  email: string;
  phoneNo: string;
  address: string;
  status: number;
  state?: {
    id: number;
    name: string;
  };
  role?: {
    id: number;
    name: string;
  };
  created_at?: string;
}

export default function UserDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  // ✅ Memoize API instance
  const api = useMemo(() => getApiClientInstance(), []);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // ✅ Wrapped in useCallback to satisfy dependency rules
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/users/get-user/${id}`);
      
      const data =
        res.data?.data?.user ||
        res.data?.data?.data ||
        res.data?.data ||
        res.data;

      if (data) setUser(data);
      else toast.error("User not found");
    } catch {
      // ✅ Removed unused 'error' variable
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id, fetchUser]);

  // ✅ Delete user
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      setDeleting(true);
      await api.delete(`/users/delete-user/${id}`);
      toast.success("User deleted successfully");
      router.push("/user/user-list");
    } catch {
      // ✅ Removed unused 'error' variable
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100 text-center">
        <p className="text-danger fw-bold fs-5">User not found</p>
        <Button variant="secondary" onClick={() => router.push('/user/user-list')}>
          <BsArrowLeft className="me-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-5 d-flex justify-content-center">
      <Card className="shadow-lg p-4" style={{ maxWidth: "650px", width: "100%" }}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold text-primary mb-0">User Details</h4>
            <Button variant="outline-secondary" onClick={() => router.push('/user/user-list')}>
              <BsArrowLeft className="me-2" /> Back
            </Button>
          </div>

          <table className="table table-borderless align-middle mb-0">
            <tbody>
              <tr>
                <th style={{ width: "40%" }}>Name</th>
                <td>{user.name}</td>
              </tr>
              <tr>
                <th>Email</th>
                <td>{user.email || "N/A"}</td>
              </tr>
              <tr>
                <th>Phone Number</th>
                <td>{user.phoneNo || "N/A"}</td>
              </tr>
              <tr>
                <th>Address</th>
                <td>{user.address || "N/A"}</td>
              </tr>
              <tr>
                <th>Role</th>
                <td>{user.role?.name || "N/A"}</td>
              </tr>
              <tr>
                <th>State</th>
                <td>{user.state?.name || "N/A"}</td>
              </tr>
              <tr>
                <th>Status</th>
                <td>
                  <span
                    className={`badge ${
                      user.status === 1 ? "bg-success" : "bg-danger"
                    }`}
                  >
                    {user.status === 1 ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
              <tr>
                <th>Created At</th>
                <td>
                  {user.created_at
                    ? new Date(user.created_at).toLocaleString()
                    : "N/A"}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="d-flex justify-content-start gap-3 mt-4">
            <PermissionGuard permission="View Activity Logs">
              <Button
                variant="outline-primary"
                className="d-flex align-items-center gap-2"
                onClick={() => router.push(`/user/user-list/details/${id}/activity-logs`)}
              >
                <BsActivity /> Activity Logs
              </Button>
            </PermissionGuard>
            
            <PermissionGuard permission="Delete User">
              <Button
                variant="outline-danger"
                className="d-flex align-items-center gap-2"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Spinner size="sm" className="me-2" /> Deleting...
                  </>
                ) : (
                  <>
                    <BsTrash /> Delete
                  </>
                )}
              </Button>
            </PermissionGuard>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}