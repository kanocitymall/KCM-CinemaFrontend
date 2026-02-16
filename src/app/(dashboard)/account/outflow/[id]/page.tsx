"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MdArrowBack, MdArrowForward, MdCallMade } from "react-icons/md";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { toast } from "react-toastify";

// --- Interfaces ---

interface Account {
  id: number;
  name: string;
  account_no?: string;
  status: number;
  balance: number;
  details?: string;
  payment_method?: {
    name: string;
    details: string;
  };
}

interface Source {
  id: number;
  booking_id?: number | null;
  amount?: string;
  paymethod_id?: number | null;
  account_id?: number | null;
  transaction_date?: string;
  status?: string;
  beneficiary?: string;
  details?: string;
  user_id?: number | null;
  date?: string;
  created_at?: string;
  updated_at?: string;
}

interface Transaction {
  id: number;
  type: "inflow" | "outflow";
  amount: string;
  description: string;
  source_type: string;
  source_id: number;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  source: Source;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface ApiResponseData {
  current_page: number;
  data: Transaction[];
  last_page: number;
  total: number;
  links: PaginationLink[];
  next_page_url: string | null;
  prev_page_url: string | null;
  from: number | null;
  to: number | null;
  per_page: number;
  path: string;
  first_page_url: string;
  last_page_url: string;
}

export default function AccountOutflowPage() {
  const { id } = useParams();
  const router = useRouter();
  const [transactionsData, setTransactionsData] = useState<ApiResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFrom, setReportFrom] = useState<string>('');
  const [reportTo, setReportTo] = useState<string>('');
  const [account, setAccount] = useState<Account | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(true);

  // 1. Stable API instance
  const api = useMemo(() => getApiClientInstance(), []);

  // 2. Wrap fetchers in useCallback to prevent infinite re-renders
  const fetchAccount = useCallback(async () => {
    try {
      setLoadingAccount(true);
      const apiClient = await api;
      const response = await apiClient.get(`/accounting/show-account/${id}`);
      const payload = response.data?.data ?? response.data;
      if (payload) {
        const normalizedAccount: Account = {
          ...payload,
          balance: Number(payload.acc_balance ?? payload.balance ?? 0),
        };
        setAccount(normalizedAccount);
      }
    } catch (error) {
      console.error("Error fetching account:", error);
      toast.error("Failed to fetch account details");
    } finally {
      setLoadingAccount(false);
    }
  }, [id, api]);

  const fetchTransactions = useCallback(async (url?: string) => {
    try {
      setIsLoading(true);
      const apiClient = await api;
      const params = { account_id: id, type: 'outflow', paginate: true };
      const res = await apiClient.get(url || '/accounting/transactions', { params });
      if (res.data.success) {
        const filteredData = {
          ...res.data.data,
          data: res.data.data.data.filter((transaction: Transaction) => transaction.type === 'outflow')
        };
        setTransactionsData(filteredData);
      } else {
        toast.error(res.data.message || 'Failed to load outflows');
      }
    } catch (error) {
      console.error('Error fetching outflows:', error);
      toast.error('Failed to load outflows');
    } finally {
      setIsLoading(false);
    }
  }, [id, api]);

  // 3. Effect with correct dependencies
  useEffect(() => {
    if (id) {
      fetchTransactions();
      fetchAccount();
    }
  }, [id, fetchAccount, fetchTransactions]);

  const handlePaginationClick = (url: string | null) => {
    if (url) {
      fetchTransactions(url);
    }
  };



  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(parseFloat(amount));
  };

  const totalOutflow = transactionsData?.data.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <div className="min-vh-100 p-4" style={{ background: '#f8f9fa' }}>
      <div className="d-flex align-items-center justify-content-between mb-5 pt-4 border-bottom pb-3">
        <div>
          <button className="btn btn-outline-secondary me-3" onClick={() => router.back()}>
            <MdArrowBack /> Back
          </button>
          <h1 className="mb-1 fw-light d-flex align-items-center gap-2">Account Outflows</h1>
          <p className="text-secondary mb-0">Overview of all outflows for this account.</p>
        </div>
        <>
          <button className="btn btn-success" onClick={() => setShowReportModal(true)} disabled={isGeneratingReport}>
            {isGeneratingReport ? 'Generating...' : 'Generate Report'}
          </button>

          {/* Date range modal */}
          <div className={`modal fade ${showReportModal ? 'show d-block' : ''}`} tabIndex={-1} role="dialog" aria-hidden={!showReportModal}>
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Generate Report</h5>
                  <button type="button" className="btn-close" onClick={() => setShowReportModal(false)} aria-label="Close"></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">From</label>
                    <input type="date" className="form-control" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">To</label>
                    <input type="date" className="form-control" value={reportTo} onChange={(e) => setReportTo(e.target.value)} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowReportModal(false)}>Cancel</button>
                  <button type="button" className="btn btn-success" onClick={async () => {
                    if (!reportFrom || !reportTo) return toast.error('Please select both dates');
                    if (new Date(reportFrom) > new Date(reportTo)) return toast.error('From date cannot be after To date');
                    setShowReportModal(false);
                    setIsGeneratingReport(true);
                    try {
                      const apiClient = await api;
                      const params = { account_id: id, paginate: false };
                      const res = await apiClient.get('/accounting/transactions', { params });
                      if (res.data.success) {
                        const allTransactions = res.data.data.data || res.data.data || [];
                        const filteredTransactions = allTransactions.filter((transaction: Transaction) => transaction.type === 'outflow' && transaction.transaction_date && new Date(transaction.transaction_date) >= new Date(reportFrom) && new Date(transaction.transaction_date) <= new Date(reportTo));
                        setTransactionsData({
                          ...res.data.data,
                          links: [],
                          next_page_url: null,
                          prev_page_url: null,
                          data: filteredTransactions
                        });
                        setTimeout(() => window.print(), 500);
                      } else {
                        toast.error(res.data.message || 'Failed to generate report');
                      }
                    } catch (error) {
                      console.error('Error generating report:', error);
                      toast.error('Failed to generate report');
                    } finally {
                      setIsGeneratingReport(false);
                    }
                  }}>Generate</button>
                </div>
              </div>
            </div>
          </div>
        </>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-md-6">
          <div className="card shadow-sm h-100 border-0 bg-danger bg-opacity-10 text-danger">
            <div className="card-body">
              <h6 className="mb-0">Total Outflow</h6>
              <h3 className="fw-bold">{formatCurrency(String(totalOutflow))}</h3>
              <small className="text-muted">Total expenses for this account.</small>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm h-100 border-0 bg-primary bg-opacity-10 text-primary">
            <div className="card-body">
              <h6 className="mb-0">Account Balance</h6>
              <h3 className="fw-bold">
                {loadingAccount ? (
                  <div className="spinner-border spinner-border-sm" role="status" />
                ) : (
                  formatCurrency(String(account?.balance ?? 0))
                )}
              </h3>
              <small className="text-muted">{account?.name ?? "Account"} balance.</small>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body">
          {transactionsData && transactionsData.data.length > 0 ? (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionsData.data.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                        <td>{transaction.description}</td>
                        <td className="text-danger fw-semibold">
                          <MdCallMade className="me-1" />
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td>
                          <span className="badge bg-danger">Expense</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {transactionsData.last_page > 1 && (
                <nav aria-label="Transactions pagination" className="mt-4">
                  <ul className="pagination justify-content-center">
                    {transactionsData.links.map((link, index) => (
                      <li key={index} className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePaginationClick(link.url)}
                          disabled={!link.url}
                        >
                          {link.label.includes('&laquo;') ? <MdArrowBack /> : link.label.includes('&raquo;') ? <MdArrowForward /> : link.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No outflows found for this account.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}