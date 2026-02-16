"use client";
import { MdAdd } from "react-icons/md";
import { IoFilter } from "react-icons/io5";
import { Modal } from "react-bootstrap";
import { FaRegEdit } from "react-icons/fa";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Account,
  PaginatedData,
  SimpleApiResponse,
  transformApiAccountToAccount,
} from "./types";
import AccountForm from "./components/account-form";
import PageHeader from "../../components/page-header";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import Loading from "../../components/loading";
import { toast } from "react-toastify";
import  PermissionGuard  from "../../components/PermissionGuard";

const Accounts = () => {
  const [account, setAccounts] = useState<Account[]>([]);
  const [pagination, setPagination] = useState<PaginatedData<Account> | null>(
    null
  );
  const [refetch, setRefetch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const api = getApiClientInstance();

  const handleCloseAccountModal = () => {
    setShowAddAccountModal(false);
    setSelectedAccount(null);
  };

  // ✅ Toggle Account Status
  const handleToggleStatus = async (acc: Account) => {
    const currentStatus = Number(acc.status) === 1;
    const newStatus = currentStatus ? 0 : 1;

    try {
      // Optimistic update
      setAccounts((prev) =>
        prev.map((a) => (a.id === acc.id ? { ...a, status: newStatus } : a))
      );

      const res = await api.patch(`/accounting/toggle-account/${acc.id}`);

      if (res.data.success) {
        toast.success(res.data.message || "Status updated successfully");
      } else {
        toast.error(res.data.message || "Failed to update status");
        // Rollback
        setAccounts((prev) =>
          prev.map((a) => (a.id === acc.id ? { ...a, status: acc.status } : a))
        );
      }
   } catch (err) { // <-- Removed the underscore
  console.error("Status update failed:", err); // <-- Use it here
  toast.error("Error updating status");
  // Rollback
  setAccounts((prev) =>
    prev.map((a) => (a.id === acc.id ? { ...a, status: acc.status } : a))
  );
}
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await api.get<SimpleApiResponse>("/accounting/accounts");

        if (res.data.success && Array.isArray(res.data.data)) {
          const transformedAccounts = res.data.data.map(
            transformApiAccountToAccount
          );
          setAccounts(transformedAccounts);
          setPagination(null);
        } else {
          console.error("Unexpected API response structure");
          setAccounts([]);
        }
      } catch (err) {
        console.error("Error loading accounts:", err);
        setAccounts([]);
      } finally {
        setLoading(false);
        setRefetch(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch, currentPage]);

  return (
    <section>
      <PageHeader title="Accounts">
        <div className="d-flex gap-2 align-items-center">
          <button className="btn d-none d-md-flex align-items-center gap-2">
            <IoFilter /> Filter
          </button>
          <input
            type="search"
            className="form-control tw-text-sm d-none d-md-block"
            placeholder="Search accounts by code, phone."
          />
           <PermissionGuard permission="Create Account">
          <button
            className="btn btn-warning d-flex align-items-center gap-2 text-nowrap"
            onClick={() => {
              setSelectedAccount(null);
              setShowAddAccountModal(true);
            }}
          >
            <MdAdd />
            Add Account
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
                  <th className="py-3 px-4 text-left">S/N</th>
                  <th>Account Name</th>
                  <th>Account Number</th>
                  <th>Account Detail</th>
                  <th className="!tw-text-green-500">Balance</th>
                  <th className="!tw-text-green-500">Payment Method</th>
                  <th className="!tw-text-green-500">Details</th>
                  <PermissionGuard permission="Toggle Account"><th className="!tw-text-green-500">Status</th></PermissionGuard>
                  <PermissionGuard permission="Edit Account"><th className="!tw-text-red-500">Action</th></PermissionGuard>
                  <PermissionGuard permission="Show Account"><th className="!tw-text-green-500">View</th></PermissionGuard>
                </tr>
              </thead>
              <tbody>
                {account.length > 0 ? (
                  account.map((acc: Account, i) => {
                    const isActive = Number(acc.status) === 1;
                    return (
                      <tr key={acc.id}>
                        <td>{i + 1}</td>
                        <td>{acc.name}</td>
                        <td>{acc.account_no}</td>
                        <td>{acc.details}</td>
                        <td>
                          {new Intl.NumberFormat("en-NG", {
                            style: "currency",
                            currency: "NGN",
                          }).format(acc.balance)}
                        </td>
                        <td>{acc.payment_method.name}</td>
                        <td>{acc.payment_method.details}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {/* ✅ Smaller slider + status text */}
                            <label className="switch small">
                              <input
                                type="checkbox"
                                checked={isActive}
                                onChange={() => handleToggleStatus(acc)}
                              />
                              <span className="slider round"></span>
                            </label>
                            <span
                              className={`fw-semibold ${
                                isActive ? "text-success" : "text-danger"
                              }`}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <PermissionGuard permission="Edit Account">
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-primary d-flex align-items-center gap-2"
                              onClick={() => {
                                setSelectedAccount(acc);
                                setShowAddAccountModal(true);
                              }}
                            >
                              <FaRegEdit />
                              Edit
                            </button>
                          </div>
                        </td>
                        </PermissionGuard>
                        <PermissionGuard permission="Show Account">
                        <td>
                          <Link
                            href={`/account/account-list/details/${acc.id}`}
                            className="btn btn-sm d-flex align-items-center gap-2 btn-outline-success"
                          >
                            Details
                          </Link>
                        </td>
                        </PermissionGuard>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="text-center py-4">
                      No accounts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {pagination && pagination.links && pagination.links.length > 0 && (
              <nav className="mt-4 d-flex justify-content-center">
                <ul className="pagination">
                  {pagination.links.map((link, index) => (
                    <li
                      key={index}
                      className={`page-item ${link.active ? "active" : ""} ${
                        !link.url ? "disabled" : ""
                      }`}
                    >
                      <PermissionGuard permission="Toggle Account">
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
                      </PermissionGuard>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </section>
      )}

      <Modal show={showAddAccountModal} onHide={handleCloseAccountModal} centered>
        <Modal.Header closeButton className="my-0 py-0 pt-3 border-bottom-0"></Modal.Header>
        <Modal.Body>
          <AccountForm account={selectedAccount} setRefetch={setRefetch} onClose={handleCloseAccountModal} />
        </Modal.Body>
      </Modal>

      {/* ✅ Smaller Switch Styling */}
      <style jsx>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 36px;
          height: 18px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.3s;
          border-radius: 18px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: #28a745;
        }
        input:checked + .slider:before {
          transform: translateX(18px);
        }
      `}</style>
    </section>
  );
};

export default Accounts;
