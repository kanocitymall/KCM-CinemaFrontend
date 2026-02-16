"use client";
import { FaRegEdit } from "react-icons/fa";
import { MdAdd } from "react-icons/md";
import { IoFilter } from "react-icons/io5";
import { Modal } from "react-bootstrap";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";

import PageHeader from "../../components/page-header";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import Loading from "../../components/loading";
import ExpenseForm from "./components/expense-form";
import PermissionGuard from "../../components/PermissionGuard";
import { AxiosError } from "axios";

// --- Types ---

type Expense = {
  id: number;
  beneficiary: string;
  amount: string; 
  details: string;
  date: string;
  status: string;
  account?: { id: number; name: string } | null;
};

type CreateExpenseFormData = {
  id?: number;
  beneficiary: string;
  amount: number;
  details: string;
  date: string;
  status?: string;
  account_id: number | null;
};

type PaginatedExpenses = {
  current_page: number;
  data: Expense[];
  per_page: number;
  total: number;
  last_page: number;
  links: { url: string | null; label: string; active: boolean }[];
  next_page_url: string | null;
  prev_page_url: string | null;
};

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<PaginatedExpenses | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetch, setRefetch] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<CreateExpenseFormData | null>(null);
  const [mode, setMode] = useState<"add" | "edit" | "manage">("add");
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Stable API instance
  const api = useMemo(() => getApiClientInstance(), []);

  const handleCloseModal = () => {
    setSelectedExpense(null);
    setShowModal(false);
    setMode("add");
  };

  // 2. Wrap loadData in useCallback to fix dependency warning
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const apiClient = await api;
      const res = await apiClient.get(`/accounting/expenses?page=${currentPage}`);
      if (res.data.success && Array.isArray(res.data.data.data)) {
        setExpenses(res.data.data.data);
        setPagination(res.data.data);
      } else {
        setExpenses([]);
        setPagination(null);
      }
    } catch (err) {
      console.error("Error loading expenses:", err);
      setExpenses([]);
      setPagination(null);
    } finally {
      setLoading(false);
      setRefetch(false);
    }
  }, [api, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData, refetch]);

  // Approve / Reject
  const handleExpenseAction = async (id: number, action: "approve" | "reject") => {
    const confirmAction = window.confirm(
      action === "approve"
        ? "Do you want to approve this expense?"
        : "Do you want to reject this expense?"
    );

    if (!confirmAction) return;

    try {
      const apiClient = await api;
      const res = await apiClient.patch(`/accounting/expense-action/${id}`, { action });

      if (res.data.success) {
        window.alert(res.data.message || "Action completed ✅");
        setExpenses((prev) =>
          prev.map((exp) => (exp.id === id ? res.data.data : exp))
        );
      } else {
        window.alert(res.data.message || "Something went wrong ❌");
      }

      setRefetch(true);
      handleCloseModal();
    } catch (err) {
      // 3. Fixed 'any' type error by checking instance
      const error = err as AxiosError<{ message?: string }>;
      console.error("Error updating expense:", error.response?.data || error);
      window.alert(error.response?.data?.message || "Something went wrong ❌");
    }
  };

  const handleEdit = (exp: Expense) => {
    if (exp.status === "approved") {
      window.alert("✅ This expense has already been approved and cannot be edited.");
      return;
    }
    if (exp.status === "rejected") {
      window.alert("❌ This expense has already been rejected and cannot be edited.");
      return;
    }

    setSelectedExpense({
      id: exp.id,
      beneficiary: exp.beneficiary,
      amount: Number(exp.amount),
      details: exp.details,
      date: exp.date,
      status: exp.status,
      account_id: exp.account?.id ?? null,
    });
    setMode("edit");
    setShowModal(true);
  };

  return (
    <div style={{ fontSize: '14px' }}>
      <section>
        <PageHeader title="Expenses">
          <div className="d-flex gap-2 align-items-center">
            <button className="btn d-none d-md-flex align-items-center gap-2">
              <IoFilter /> Filter
            </button>
            <input
              type="search"
              className="form-control tw-text-sm d-none d-md-block"
              placeholder="Search expenses by beneficiary, details."
            />
            <PermissionGuard permission="Create Expense">
              <button
                className="btn btn-warning d-flex align-items-center gap-2 text-nowrap"
                onClick={() => {
                  setSelectedExpense(null);
                  setMode("add");
                  setShowModal(true);
                }}
              >
                <MdAdd />
                Add Expense
              </button>
            </PermissionGuard>
          </div>
        </PageHeader>

        {loading ? (
          <Loading />
        ) : (
          <section className="pt-4">
            <div className="table-responsive mt-4">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>S/N</th>
                    <th>Beneficiary</th>
                    <th>Amount</th>
                    <th>Details</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Account</th>
                    <PermissionGuard permission="Manage Expenses"><th>Action</th></PermissionGuard>
                    <PermissionGuard permission="Edit Expense"> <th className="text-center">Edit</th></PermissionGuard>
                    <PermissionGuard permission="Show Expense"> <th className="text-center">Details</th></PermissionGuard>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length > 0 ? (
                    expenses.map((exp, i) => (
                      <tr key={exp.id}>
                        <td>{i + 1}</td>
                        <td>{exp.beneficiary || "N/A"}</td>
                        <td>
                          {new Intl.NumberFormat("en-NG", {
                            style: "currency",
                            currency: "NGN",
                          }).format(Number(exp.amount) || 0)}
                        </td>
                        <td>{exp.details || "N/A"}</td>
                        <td>{exp.date ? new Date(exp.date).toLocaleDateString() : "N/A"}</td>
                        <td>
                          <span
                            className={`badge ${
                              exp.status === "approved"
                                ? "bg-success"
                                : exp.status === "rejected"
                                ? "bg-danger"
                                : "bg-secondary"
                            }`}
                          >
                            {exp.status || "pending"}
                          </span>
                        </td>
                        <td>{exp.account?.name || "No Account"}</td>
                        <td>
                          <div className="d-flex gap-2 flex-wrap">
                            {exp.status === "pending" ? (
                              <PermissionGuard permission="Manage Expenses">
                                <button
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() => {
                                    setSelectedExpense({
                                      id: exp.id,
                                      beneficiary: exp.beneficiary,
                                      amount: Number(exp.amount),
                                      details: exp.details,
                                      date: exp.date,
                                      status: exp.status,
                                      account_id: exp.account?.id ?? null,
                                    });
                                    setMode("manage");
                                    setShowModal(true);
                                  }}
                                >
                                  Action
                                </button>
                              </PermissionGuard>
                            ) : (
                              <span className="text-muted">No Action</span>
                            )}
                          </div>
                        </td>
                        <PermissionGuard permission="Edit Expense">
                        <td className="text-center">
                            <button
                              className="btn btn-primary d-flex align-items-center gap-2"
                              onClick={() => handleEdit(exp)}
                            >
                              <FaRegEdit size={14} />
                              Edit
                            </button>
                        </td>
                        </PermissionGuard>
                        <PermissionGuard permission="Show Expense">
                        <td>
                          <Link
                            href={`/account/expense-list/details/${exp.id}`}
                            className="btn btn-sm d-flex align-items-center gap-2 btn-outline-success"
                          >
                            Details
                          </Link>
                        </td>
                        </PermissionGuard>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="text-center py-4">No expenses found</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination && pagination.links.length > 3 && (
                <nav className="mt-4 d-flex justify-content-center">
                  <ul className="pagination">
                    {pagination.links.map((link, index) => (
                      <li
                        key={index}
                        className={`page-item ${link.active ? "active" : ""} ${!link.url ? "disabled" : ""}`}
                      >
                        <button
                          className="page-link"
                          dangerouslySetInnerHTML={{ __html: link.label }}
                          onClick={() => {
                            if (link.url) {
                              const url = new URL(link.url);
                              const page = url.searchParams.get("page");
                              if (page) setCurrentPage(Number(page));
                            }
                          }}
                          disabled={!link.url}
                        />
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </div>
          </section>
        )}

        <Modal show={showModal} onHide={handleCloseModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {mode === "add" ? "Add Expense" : mode === "edit" ? "Edit Expense" : "Manage Expense"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {mode === "manage" && selectedExpense ? (
              <div>
                <p><b>Beneficiary:</b> {selectedExpense.beneficiary}</p>
                <p><b>Amount:</b> {selectedExpense.amount}</p>
                <p><b>Details:</b> {selectedExpense.details}</p>
                <p><b>Date:</b> {selectedExpense.date}</p>
                <p><b>Status:</b> <span className={`badge ${selectedExpense.status === "approved" ? "bg-success" : selectedExpense.status === "rejected" ? "bg-danger" : "bg-secondary"}`}>{selectedExpense.status || "pending"}</span></p>
                {selectedExpense.status === "pending" ? (
                  <PermissionGuard permission="Manage Expenses">
                    <div className="d-flex gap-3 mt-4">
                      <button className="btn btn-success" onClick={() => handleExpenseAction(selectedExpense.id!, "approve")}>Approve</button>
                      <button className="btn btn-danger" onClick={() => handleExpenseAction(selectedExpense.id!, "reject")}>Reject</button>
                    </div>
                  </PermissionGuard>
                ) : (
                  <p className="text-muted mt-3">This expense is already <b>{selectedExpense.status}</b>. No further action allowed.</p>
                )}
              </div>
            ) : (
              <ExpenseForm expense={selectedExpense} setRefetch={setRefetch} onSuccess={handleCloseModal} />
            )}
          </Modal.Body>
        </Modal>
      </section>
    </div>
  );
};

export default ExpensesPage;