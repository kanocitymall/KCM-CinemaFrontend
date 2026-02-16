"use client";

import { MdAdd } from "react-icons/md";
import Link from "next/link";
import { Modal } from "react-bootstrap";
import { useEffect, useState, useMemo, useCallback } from "react";
import { FaRegEdit } from "react-icons/fa";
import { toast } from "react-toastify";

// Project Imports
import CustomerForm from "./components/customer-form";
import PageHeader from "../../components/page-header";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import Loading from "../../components/loading";
import PermissionGuard from "../../components/PermissionGuard";

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

interface PaginationData {
  data: Customer[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refetch, setRefetch] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  const api = useMemo(() => getApiClientInstance(), []);

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCustomer(null);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<ApiResponse<PaginationData>>(`/customers?page=${currentPage}`);
      if (res.data?.success) {
        setCustomers(res.data.data.data || []);
        setPagination(res.data.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load customers";
      console.error("❌", errorMessage);
      setCustomers([]);
    } finally {
      setLoading(false);
      setRefetch(false);
    }
  }, [api, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData, refetch]);

  const updateCustomerStatus = async (customer: Customer) => {
    const prevCustomers = [...customers];
    const newStatus = customer.status === 1 ? 0 : 1;

    setCustomers((prev) =>
      prev.map((c) => (c.id === customer.id ? { ...c, status: newStatus } : c))
    );
    setUpdatingId(customer.id);

    try {
      await api.patch(`/customers/toggle-customer/${customer.id}`, {
        status: newStatus,
      });
      toast.success("Status updated successfully");
    } catch (error) {
      console.error("Status update error:", error);
      setCustomers(prevCustomers);
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section>
      <PageHeader title="CUSTOMERS">
        <div className="d-flex gap-2 align-items-center">
          <input
            type="search"
            className="form-control tw-text-sm d-none d-md-block"
            placeholder="Search customers..."
          />
          <PermissionGuard permission="Create Customer">
            <button
              className="btn btn-warning d-flex align-items-center gap-2 text-nowrap fw-bold"
              onClick={() => {
                setSelectedCustomer(null);
                setShowModal(true);
              }}
            >
              <MdAdd /> Add Customer
            </button>
          </PermissionGuard>
        </div>
      </PageHeader>

      {loading ? (
        <Loading />
      ) : (
        <section className="pt-4">
          <div className="table-responsive mt-4">
            <table className="table table-sm align-middle" style={{ fontSize: "0.85rem" }}>
              <thead className="table-light">
                <tr>
                  <th>S/N</th>
                  <th>Full Name</th>
                  <th>Code</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <PermissionGuard permission="Edit Customer">
                    <th>Action</th>
                  </PermissionGuard>
                  <PermissionGuard permission="Show Customer">
                    <th className="text-center">Details</th>
                  </PermissionGuard>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-muted">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  customers.map((c, i) => {
                    const isActive = c.status === 1;
                    const serialNumber = pagination
                      ? (pagination.current_page - 1) * pagination.per_page + (i + 1)
                      : i + 1;

                    return (
                      <tr key={c.id}>
                        <td>{serialNumber}</td>
                        <td className="fw-bold" style={{ minWidth: "150px" }}>{c.name}</td>
                        <td>
                          <span className="badge bg-light text-dark border">{c.code}</span>
                        </td>
                        <td>{c.phoneno}</td>
                        <td>{c.email}</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={isActive}
                              disabled={updatingId === c.id}
                              onChange={() => updateCustomerStatus(c)}
                              style={{ cursor: "pointer" }}
                            />
                            <small className={isActive ? "text-success ms-1" : "text-danger ms-1"}>
                              {isActive ? "Active" : "Inactive"}
                            </small>
                          </div>
                        </td>
                        
                        <PermissionGuard permission="Edit Customer">
                          <td>
                            <button
                              className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                              onClick={() => {
                                setSelectedCustomer(c);
                                setShowModal(true);
                              }}
                            >
                              <FaRegEdit /> Edit
                            </button>
                          </td>
                        </PermissionGuard>

                        <PermissionGuard permission="Show Customer">
                          <td className="text-center">
                            <Link
                              href={`/customer/customer-list/details/${c.id}`}
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

          {pagination && pagination.last_page > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 border-top pt-3">
              <span className="text-muted small">
                Showing {customers.length} of {pagination.total} items
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
                  disabled={currentPage === pagination.last_page}
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
          <Modal.Title className="h6">{selectedCustomer ? "Edit" : "Add"} Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CustomerForm
            customer={selectedCustomer}
            setRefetch={setRefetch}
            onClose={handleCloseModal}
          />
        </Modal.Body>
      </Modal>
    </section>
  );
};

export default Customers;