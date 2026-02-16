"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Spinner, Card, Dropdown } from "react-bootstrap";
import { BsArrowLeft, BsTrash } from "react-icons/bs";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { toast } from "react-toastify";
import  PermissionGuard  from "../../../../components/PermissionGuard";

interface PaymentMethod {
  name: string;
  details: string;
}

interface AccountDetails {
  id: number;
  name: string;
  account_no?: string;
  account_number?: string;
  status: number;
  balance: number;
  details?: string;
  payment_method?: PaymentMethod;
  created_at?: string;
  updated_at?: string;
}

export default function AccountDetailsPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const router = useRouter();
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  

  useEffect(() => {
    if (id) fetchAccountDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);
      const apiClient = await getApiClientInstance();
      const response = await apiClient.get(`/accounting/show-account/${id}`);
      const payload = response.data?.data ?? response.data;

      if (!payload) {
        setAccount(null);
        return;
      }

      // ✅ Normalize backend response safely and use API-provided acc_balance
      const normalizedPayload: AccountDetails = {
        ...payload,
        account_no: payload.account_no ?? payload.account_number,
        balance: Number(payload.acc_balance ?? payload.balance ?? 0),
      };

      setAccount(normalizedPayload);
    } catch (error) {
      console.error("Error fetching account:", error);
      toast.error("Failed to fetch account details");
      setAccount(null);
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this account?")) return;

    try {
      setDeleting(true);
      const apiClient = await getApiClientInstance();
      const res = await apiClient.delete(`/accounting/delete-account/${id}`);
      toast.success(res.data?.message ?? "Account deleted");
      router.push("/account/account-list");
    } catch (err) {
      console.error("Error deleting account:", err);
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center mt-5">
        <p>Account not found.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-body-tertiary d-flex justify-content-center py-5 px-3">
      <div className="w-100" style={{ maxWidth: "680px" }}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap">
          <div className="d-flex align-items-center mb-3 mb-md-0">
            <Button
              variant="outline-secondary"
              className="d-flex align-items-center gap-2 rounded-3"
              onClick={() => router.back()}
            >
              <BsArrowLeft /> Back
            </Button>
            <h4 className="ms-3 mb-0 fw-semibold">{account.name}</h4>
          </div>
        </div>

        {/* Card */}
        <Card className="border-0 shadow-sm rounded-4 p-4 bg-light-subtle">
          <div className="d-flex flex-column gap-4">
            {/* Account Info */}
            <div className="d-flex justify-content-between flex-wrap border-bottom pb-3">
              <div>
                <h6 className="text-muted mb-1">Account Number</h6>
                <p className="fs-5 fw-semibold text-dark">
                  {account.account_no || "—"}
                </p>
              </div>

              <div className="text-end">
                <h6 className="text-muted mb-1">Transactions</h6>
                <PermissionGuard permission="View Range Transactions By Type">
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-primary">
                      Transactions
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => router.push(`/account/inflow/${id}`)}>
                        View Inflows
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => router.push(`/account/outflow/${id}`)}>
                        View Outflows
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </PermissionGuard>
              </div>
            </div>

            {/* ✅ Balance (Corrected & Prominent) */}
            <div className="d-flex justify-content-between align-items-center border-bottom pb-3">
              <div>
                <h6 className="text-muted mb-1">Account Balance</h6>
                <p className="fs-4 fw-bold text-success mb-0">
                  {new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: "NGN",
                  }).format(account.balance ?? 0)}
                </p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="border-bottom pb-3">
              <h6 className="text-muted mb-1">Payment Method</h6>
              <p className="fw-semibold mb-0 text-dark">
                {account.payment_method?.name ?? "—"}
              </p>
              <small className="text-muted">
                {account.payment_method?.details ?? ""}
              </small>
            </div>

            {/* Description */}
            <div className="border-bottom pb-3">
              <h6 className="text-muted mb-1">Description</h6>
              <p className="border rounded p-3 bg-body-tertiary mb-0 text-dark">
                {account.details ?? "No description provided."}
              </p>
            </div>

            {/* Dates */}
            <div className="d-flex flex-column flex-md-row justify-content-between text-muted small border-bottom pb-3">
              <p className="mb-0">
                <strong>Created:</strong>{" "}
                {account.created_at
                  ? new Date(account.created_at).toLocaleString()
                  : "—"}
              </p>
              <p className="mb-0">
                <strong>Updated:</strong>{" "}
                {account.updated_at
                  ? new Date(account.updated_at).toLocaleString()
                  : "—"}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-3 d-flex gap-2 align-items-center">
              <div>
                <h6 className="text-muted mb-1">Status</h6>
                <span
                  className={`badge px-3 py-2 fs-6 ${
                    account.status === 1 ? "bg-success" : "bg-secondary"
                  }`}
                >
                  {account.status === 1 ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="ms-auto d-flex gap-2">
                <PermissionGuard permission="Delete Account ">
                  <Button
                    variant="outline-danger"
                    className="d-flex align-items-center gap-2 rounded-3 px-3 py-2"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? <Spinner size="sm" /> : <><BsTrash /> Delete</>}
                  </Button>
                </PermissionGuard>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
