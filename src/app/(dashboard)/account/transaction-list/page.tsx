"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
// Removed MdDescription as it was unused to fix linting warning
import { MdArrowBack, MdArrowForward, MdCallMade, MdCallReceived } from "react-icons/md";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { toast } from "react-toastify";


// --- 1. Interfaces ---

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
    source: Source | null;
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

// --- 2. Helpers ---

const formatCurrency = (amount: string) => {
    const num = parseFloat(amount || "0");
    return new Intl.NumberFormat('en-NG', { 
        style: 'currency', 
        currency: 'NGN', 
        minimumFractionDigits: 2 
    }).format(num);
};

// --- 3. Main Component ---

export default function TransactionsPage() {
    const [transactionsData, setTransactionsData] = useState<ApiResponseData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [totalInflow, setTotalInflow] = useState(0);
    const [totalOutflow, setTotalOutflow] = useState(0);
    const [loadingTotals, setLoadingTotals] = useState(true);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportFrom, setReportFrom] = useState<string>('');
    const [reportTo, setReportTo] = useState<string>('');

    // CORRECTION: Memoize the API instance to prevent infinite re-renders
    const api = useMemo(() => getApiClientInstance(), []);

    // Memoized Fetch Totals
    const fetchTotals = useCallback(async () => {
        try {
            setLoadingTotals(true);
            const res = await api.get('/accounting/transactions', { params: { paginate: false } });
            if (res.data.success) {
                const allTransactions = res.data.data.data || res.data.data || [];
                const inflow = allTransactions
                    .filter((t: Transaction) => t.type === 'inflow')
                    .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount || '0'), 0);
                const outflow = allTransactions
                    .filter((t: Transaction) => t.type === 'outflow')
                    .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount || '0'), 0);
                setTotalInflow(inflow);
                setTotalOutflow(outflow);
            }
        } catch (error) {
            console.error('Error fetching totals:', error);
        } finally {
            setLoadingTotals(false);
        }
    }, [api]);

    // Memoized Fetch Transactions
    const fetchTransactions = useCallback(async (url?: string) => {
        try {
            setIsLoading(true);
            const params = { paginate: true };
            const res = await api.get(url || '/accounting/transactions', { params });
            if (res.data.success) {
                setTransactionsData(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setIsLoading(false);
        }
    }, [api]);

    // Initial Load - Now stable with proper dependencies
    useEffect(() => {
        fetchTotals();
        fetchTransactions();
    }, [fetchTotals, fetchTransactions]);

    // Pagination Handler
    const handlePaginationClick = (url: string | null) => {
        if (url) {
            fetchTransactions(url);
        }
    };

    return (
        <div className="min-vh-100 p-4" style={{ background: '#f8f9fa' }}>
            <div className="d-flex align-items-center justify-content-between mb-5 pt-4 border-bottom pb-3">
                <div>
                    <h1 className="mb-1 fw-light d-flex align-items-center gap-2"> Transactions List</h1>
                    <p className="text-secondary mb-0">Overview of all financial inflows and outflows.</p>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-sm btn-success" onClick={() => { setReportFrom(''); setReportTo(''); setShowReportModal(true); }}>Generate Report</button>
                </div>
            </div>

            <div className="row g-4 mb-5">
                <div className="col-md-6">
                    <div className="card shadow-sm h-100 border-0 bg-success bg-opacity-10 text-success">
                        <div className="card-body">
                            <h6 className="mb-0">Total Inflow</h6>
                            <h3 className="fw-bold">
                                {loadingTotals ? <span className="spinner-border spinner-border-sm" /> : formatCurrency(String(totalInflow))}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card shadow-sm h-100 border-0 bg-danger bg-opacity-10 text-danger">
                        <div className="card-body">
                            <h6 className="mb-0">Total Outflow</h6>
                            <h3 className="fw-bold">
                                {loadingTotals ? <span className="spinner-border spinner-border-sm" /> : formatCurrency(String(totalOutflow))}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-lg border-0" style={{ borderRadius: '12px' }}>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '15%' }}>Date</th>
                                    <th style={{ width: '15%' }}>Type</th>
                                    <th style={{ width: '40%' }}>Description</th>
                                    <th style={{ width: '15%', textAlign: 'right' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading || !transactionsData ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-5">
                                            <div className="spinner-border text-primary" />
                                            <p className="mt-2 text-muted">Loading transactions...</p>
                                        </td>
                                    </tr>
                                ) : (
                                    transactionsData.data.map((tx) => {
                                        const isOutflow = tx.type === 'outflow';
                                        const typeColor = isOutflow ? 'text-danger' : 'text-success';
                                        // CORRECTION: Re-added the visual icons
                                        const TypeIcon = isOutflow ? MdCallMade : MdCallReceived;
                                        return (
                                            <tr key={tx.id}>
                                                <td className="text-muted">{tx.transaction_date}</td>
                                                <td>
                                                    <span className={`fw-medium ${typeColor}`}>
                                                        <TypeIcon className="me-1" />
                                                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                                    </span>
                                                </td>
                                                <td>{tx.description}</td>
                                                <td className={`fw-bold ${typeColor}`} style={{ textAlign: 'right' }}>
                                                    {isOutflow ? `- ${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card-footer bg-white d-flex justify-content-between align-items-center p-4">
                    <small className="text-muted">
                        {transactionsData ? `Showing ${transactionsData.from || 0} to ${transactionsData.to || 0} of ${transactionsData.total} entries` : 'Loading...'}
                    </small>
                    
                    {transactionsData?.links && (
                        <nav>
                            <ul className="pagination pagination-sm mb-0">
                                <li className={`page-item ${!transactionsData.prev_page_url || isLoading ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => handlePaginationClick(transactionsData.prev_page_url)}>
                                        <MdArrowBack /> Previous
                                    </button>
                                </li>
                                {transactionsData.links.map((link, index) => {
                                    if (link.label.includes('Previous') || link.label.includes('Next')) return null;
                                    return (
                                        <li key={index} className={`page-item ${link.active ? 'active' : ''} ${!link.url || isLoading ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => handlePaginationClick(link.url)}>
                                                {link.label.replace('&laquo; ', '').replace(' &raquo;', '')}
                                            </button>
                                        </li>
                                    );
                                })}
                                <li className={`page-item ${!transactionsData.next_page_url || isLoading ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => handlePaginationClick(transactionsData.next_page_url)}>
                                        Next <MdArrowForward />
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </div>
            </div>

                        {/* Date range modal (simple) */}
                        <div className={`modal fade ${showReportModal ? 'show d-block' : ''}`} tabIndex={-1} role="dialog" aria-hidden={!showReportModal}>
                            <div className="modal-dialog modal-dialog-centered" role="document">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Generate Transactions Report</h5>
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
                                                const res = await api.get('/accounting/transactions', { params: { paginate: false } });
                                                if (res.data.success) {
                                                    const allTransactions = res.data.data.data || res.data.data || [];
                                                    const filtered = allTransactions.filter((t: Transaction) => t.transaction_date && new Date(t.transaction_date) >= new Date(reportFrom) && new Date(t.transaction_date) <= new Date(reportTo));
                                                    setTransactionsData({
                                                        ...res.data.data,
                                                        current_page: 1,
                                                        last_page: 1,
                                                        links: [],
                                                        next_page_url: null,
                                                        prev_page_url: null,
                                                        data: filtered
                                                    });
                                                    setTimeout(() => window.print(), 500);
                                                } else {
                                                    toast.error(res.data.message || 'Failed to generate report');
                                                }
                                            } catch (err) {
                                                console.error('Error generating transactions report:', err);
                                                toast.error('Failed to generate report');
                                            } finally {
                                                setIsGeneratingReport(false);
                                            }
                                        }}>{isGeneratingReport ? 'Generating...' : 'Generate'}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
        </div>
    );
}