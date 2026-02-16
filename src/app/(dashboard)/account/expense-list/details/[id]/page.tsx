"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Spinner, Card, Modal } from "react-bootstrap";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { toast } from "react-toastify";
import PermissionGuard from "../../../../components/PermissionGuard";

// --- Define Interface to fix 'any' error ---
interface Expense {
  id: number;
  beneficiary: string;
  amount: string | number;
  details: string;
  date: string;
  status: string;
  account_id?: number;
  account?: {
    name: string;
    account_no?: string;
  };
}

const ExpenseDetailsPage = () => {
  const { id } = useParams();
  const router = useRouter();

  // 1. Stable API instance
  const api = useMemo(() => getApiClientInstance(), []);

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 2. Wrap fetcher in useCallback
  const fetchExpense = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/accounting/show-expense/${id}`);

      if (res.data?.success && res.data?.data) {
        setExpense(res.data.data);
      } else {
        setExpense(null);
      }
    } catch (err) {
      console.error("Error fetching expense:", err);
      setExpense(null);
    } finally {
      setLoading(false);
    }
  }, [id, api]);

  // 3. Effect with proper dependencies
  useEffect(() => {
    if (id) fetchExpense();
  }, [id, fetchExpense]);

  // Handle Delete
  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await api.delete(`/accounting/delete-expense/${id}`);
      if (res.data?.success) {
        toast.success("Expense deleted successfully!");
        router.push("/account/expense-list");
      } else {
        toast.error("Failed to delete expense");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Error deleting expense");
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <Spinner animation="border" variant="primary" />
      </div>
    );

  if (!expense)
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 text-center">
        <h5 className="mb-3 text-muted">Expense not found</h5>
        <Button variant="outline-secondary" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <Card
        className="p-4 shadow-lg border-0 animate__animated animate__fadeInUp"
        style={{ maxWidth: "550px", width: "100%" }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold text-primary mb-0">Expense Details</h4>
          <Button variant="outline-primary" size="sm" onClick={() => router.back()}>
            Back
          </Button>
        </div>

        <div className="mb-2">
          <strong>Beneficiary:</strong>{" "}
          <span className="text-secondary">{expense.beneficiary || "N/A"}</span>
        </div>
        <div className="mb-2">
          <strong>Amount:</strong>{" "}
          <span className="text-success">
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
            }).format(Number(expense.amount) || 0)}
          </span>
        </div>
        <div className="mb-2">
          <strong>Details:</strong>{" "}
          <span className="text-secondary">{expense.details || "N/A"}</span>
        </div>
        <div className="mb-2">
          <strong>Date:</strong>{" "}
          <span className="text-secondary">
            {expense.date ? new Date(expense.date).toLocaleDateString() : "N/A"}
          </span>
        </div>
        <div className="mb-2">
          <strong>Status:</strong>{" "}
          <span
            className={`badge px-3 py-2 ${
              expense.status === "approved"
                ? "bg-success"
                : expense.status === "rejected"
                ? "bg-danger"
                : "bg-warning text-dark"
            }`}
          >
            {expense.status || "Pending"}
          </span>
        </div>
        <div className="mb-4">
          <strong>Account:</strong>{" "}
          <span className="text-secondary">
            {expense.account?.name
              ? `${expense.account.name}${expense.account.account_no ? ` (${expense.account.account_no})` : ''}`
              : expense.account_id
              ? `Account ID: ${expense.account_id}`
              : "No Account"}
          </span>
        </div>

        <div className="d-flex justify-content-between">
          <PermissionGuard permission="Delete Expense">
            <Button
              variant="danger"
              onClick={() => setShowConfirm(true)}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Expense"}
            </Button>
          </PermissionGuard>
          <Button variant="outline-secondary" onClick={() => router.push("/account/expense-list")}>
            Back to List
          </Button>
        </div>
      </Card>

      {/* Confirm Delete Modal */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this expense? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Yes, Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ExpenseDetailsPage;