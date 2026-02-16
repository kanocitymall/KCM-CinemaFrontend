"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { MdArrowBack, MdDelete, MdPerson, MdEmail, MdPhone, MdLocationOn } from "react-icons/md";
import Link from "next/link";

// Project Imports
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import Loading from "../../../../components/loading";
import PermissionGuard from "../../../../components/PermissionGuard";

// --- Interfaces ---

interface User {
  id: number;
  name: string;
  phoneNo: string;
  address: string | null;
  email: string;
  role_id: number;
  status: number;
}

interface Customer {
  id: number;
  name: string;
  phoneno: string;
  code: string;
  email: string;
  address: string;
  user_id: number;
  status: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

const CustomerDetails = () => {
  const { id } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const api = useMemo(() => getApiClientInstance(), []);

  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<ApiResponse<Customer>>(`/customers/get-customer/${id}`);
      if (res.data.success) {
        setCustomer(res.data.data);
      }
    } catch (error: unknown) {
      console.error('fetchCustomer error', error);
      toast.error("Could not retrieve customer details");
      router.push("/customer/list");
    } finally {
      setLoading(false);
    }
  }, [api, id, router]);

  useEffect(() => {
    if (id) fetchCustomer();
  }, [fetchCustomer, id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return;

    try {
      setDeleting(true);
      await api.delete(`/customers/delete-customer/${id}`);
      toast.success("Customer deleted successfully");
      router.push("/customer/customer-list");
    } catch (error: unknown) {
      console.error('delete customer error', error);
      toast.error("Failed to delete customer");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loading />;
  if (!customer) return <div className="p-5 text-center">Customer not found.</div>;

  return (
    <section className="container-fluid py-4">
      {/* Header Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link href="/customer/customer-list" className="btn btn-outline-secondary d-flex align-items-center gap-2">
          <MdArrowBack /> Back to List
        </Link>

        <PermissionGuard permission="Delete Customer">
          <button 
            className="btn btn-danger d-flex align-items-center gap-2 shadow-sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : <><MdDelete /> Delete Customer</>}
          </button>
        </PermissionGuard>
      </div>

      <div className="row g-4">
        {/* Profile Card */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm text-center p-4">
            <div className="mx-auto bg-light rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
              <MdPerson size={40} className="text-secondary" />
            </div>
            <h4 className="fw-bold mb-1">{customer.name}</h4>
            <span className="badge bg-info text-dark mb-3">{customer.code}</span>
            <div className={`fw-bold ${customer.status === 1 ? 'text-success' : 'text-danger'}`}>
              ● {customer.status === 1 ? 'Active Account' : 'Inactive Account'}
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm p-4">
            <h5 className="border-bottom pb-2 mb-4">Contact Information</h5>
            
            <div className="row gy-4">
              <div className="col-md-6">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 bg-light rounded text-primary"><MdEmail /></div>
                  <div>
                    <small className="text-muted d-block">Email Address</small>
                    <span className="fw-medium">{customer.email}</span>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 bg-light rounded text-primary"><MdPhone /></div>
                  <div>
                    <small className="text-muted d-block">Phone Number</small>
                    <span className="fw-medium">{customer.phoneno}</span>
                  </div>
                </div>
              </div>

              <div className="col-12">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 bg-light rounded text-primary"><MdLocationOn /></div>
                  <div>
                    <small className="text-muted d-block">Residential Address</small>
                    <span className="fw-medium">{customer.address}</span>
                  </div>
                </div>
              </div>
            </div>

            <h5 className="border-bottom pb-2 mb-4 mt-5">System Meta</h5>
            <div className="row text-muted small">
              <div className="col-sm-6">Created: {new Date(customer.created_at).toLocaleString()}</div>
              <div className="col-sm-6 text-sm-end">Last Updated: {new Date(customer.updated_at).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomerDetails;