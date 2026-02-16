"use client";
import { IoFilter } from "react-icons/io5";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ApiResponse, PaginatedData } from "./types";
import PageHeader from "../../components/page-header";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import Loading from "../../components/loading";
import { toast } from "react-toastify";
import PermissionGuard from "../../components/PermissionGuard";

interface Refund {
    id: number;
    booking_id: number;
    amount: string;
    reason: string | null;
    paymethod_id: number;
    account_id: number;
    date: string;
    created_at: string;
    updated_at: string;
    account: {
        name: string;
        number: string | null;
        description: string;
    };
    payment_method: {
        name: string;
    };
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
} 
const RefundsList = () => {
    // 🛑 State updated to handle Refund data
    const [refunds, setRefunds] = useState<Refund[]>([]);
    const [pagination, setPagination] = useState<PaginatedData<Refund> | null>(
        null
    );
    const [refetch, setRefetch] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportFrom, setReportFrom] = useState<string>('');
    const [reportTo, setReportTo] = useState<string>('');
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    
    // 🛑 Removed agent-specific states (updatingId, deletingId, showAddAgentModal, selectedAgent)

    const api = useMemo(() => getApiClientInstance(), []);
    const router = useRouter();

    // 🔹 API: fetch refunds
    const loadData = useCallback(async (page: number = 1) => {
        try {
            setLoading(true);
            // 🛑 Changed API endpoint to the refund list endpoint
            const res = await api.get<ApiResponse>(`/bookings/refund-list?page=${page}`);
            
            // 🛑 Updated state to use Refund data
            setRefunds(res.data.data.data as Refund[]);
            setPagination(res.data.data as PaginatedData<Refund>);
        } catch (err: unknown) {
            console.log(err);
        } finally {
            setLoading(false);
            setRefetch(false);
        }
    }, [api]);

    useEffect(() => {
        loadData(currentPage);
    }, [refetch, currentPage, loadData]);

    const handleGenerateReport = async () => {
        // basic validation
        if (!reportFrom || !reportTo) {
            return toast.error('Please select both dates');
        }
        if (new Date(reportFrom) > new Date(reportTo)) {
            return toast.error('From date cannot be after To date');
        }
        
        try {
            setIsGeneratingReport(true);
            const res = await api.get<ApiResponse>(`/bookings/refund-list?paginate=false`);
            
            if (res.data.data.data) {
                // Filter refunds by date range
                const filteredRefunds = (res.data.data.data as Refund[]).filter((refund: Refund) => {
                    const refundDate = new Date(refund.date);
                    return refundDate >= new Date(reportFrom) && refundDate <= new Date(reportTo);
                });
                
                // Set data for printing
                setRefunds(filteredRefunds);
                setPagination(null); // Remove pagination for report
                setShowReportModal(false);
                
                // Trigger print
                setTimeout(() => {
                    window.print();
                }, 500);
            } else {
                toast.error('Failed to generate report');
            }
        } catch (error: unknown) {
            console.error('Error generating report:', error);
            toast.error('Failed to generate report');
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handlePaginationClick = (url: string | null) => {
        if (url) {
            const urlObj = new URL(url);
            const page = urlObj.searchParams.get("page");
            if (page) {
                setCurrentPage(Number(page));
            }
        }
    };

    return (
        <section>
            {/* 🛑 Updated Page Header Title */}
            <PageHeader title="BOOKING REFUNDS">
                <div className="d-flex gap-2 align-items-center">
                      <PermissionGuard permission="Account Transactions">
                    <button
                        className="btn btn-success"
                        onClick={() => setShowReportModal(true)}
                        disabled={isGeneratingReport}
                    >
                        {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                    </button>
                    </PermissionGuard>
                    <button
                        className="btn btn-secondary d-flex align-items-center gap-2"
                        onClick={() => router.back()}
                    >
                        Back
                    </button>
                    <button className="btn d-none d-md-flex align-items-center gap-2">
                        <IoFilter /> Filter
                    </button>
                    <input
                        type="search"
                        className="form-control tw-text-sm d-none d-md-block"
                        placeholder="Search refunds by booking ID or reason..."
                    />
                    {/* 🛑 Removed Add Agent button, as refunds are typically not added manually here */}
                </div>
            </PageHeader>

            {/* Date range modal */}
            <div className={`modal fade ${showReportModal ? 'show d-block' : ''}`} tabIndex={-1} role="dialog" aria-hidden={!showReportModal}>
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Generate Refund Report</h5>
                            <button type="button" className="btn-close" onClick={() => setShowReportModal(false)} aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">From</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    value={reportFrom} 
                                    onChange={(e) => setReportFrom(e.target.value)} 
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">To</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    value={reportTo} 
                                    onChange={(e) => setReportTo(e.target.value)} 
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={() => setShowReportModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-success" 
                                onClick={handleGenerateReport}
                                disabled={isGeneratingReport}
                            >
                                {isGeneratingReport ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <Loading />
            ) : (
                <section className="pt-4">
                    <div className="table-responsive mt-4">
                        <table className="table table-sm align-middle">
                            <thead>
                                <tr>
                                    <th>S/N</th>
                                    <th>Booking ID</th>
                                    <th>Amount</th>
                                    <th>Reason</th>
                                    <th>Date</th>
                                    <th>Pay Method</th>
                                    <th>Account Name</th>
                                    {/* ❌ Removed <th>View Details</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {/* 🛑 Mapped over refunds array and updated table cells */}
                                {refunds?.map((refund: Refund, i) => (
                                    <tr key={refund.id || i}>
                                        <td>{(pagination?.from || 0) + i}</td>
                                        <td>{refund.booking_id}</td>
                                        <td>₦{Number(refund.amount).toLocaleString()}</td>
                                        <td>{refund.reason || 'N/A'}</td>
                                        <td>{new Date(refund.date).toLocaleDateString()}</td>
                                        <td>{refund.payment_method.name}</td>
                                        <td>{refund.account.name}</td>
                                        
                                        {/* ❌ Removed View Details table data (<td>...</td>) */}
                                    </tr>
                                ))}
                                {/* Handle empty state */}
                                {refunds.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center">No refund data available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {pagination && pagination.links.length > 0 && (
                            <nav className="mt-4 d-flex justify-content-center">
                                <ul className="pagination">
                                    {pagination.links.map((link: PaginationLink, index: number) => (

                                        <li
                                            key={index}
                                            className={`page-item ${link.active ? "active" : ""} ${
                                                !link.url ? "disabled" : ""
                                            }`}
                                        >
                                            <button
                                                className="page-link"
                                                onClick={() => handlePaginationClick(link.url)}
                                                disabled={!link.url}
                                            >
                                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        )}

                    </div>
                </section>
            )}

            {/* 🛑 Removed AgentForm Modal */}
        </section>
    );
};

export default RefundsList;