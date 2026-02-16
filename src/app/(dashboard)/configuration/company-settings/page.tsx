"use client";

import { FaRegEdit } from "react-icons/fa";
import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { Company, SimpleApiResponse } from "./types";
import CompanyForm from "./components";
import PageHeader from "../../components/page-header";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import Loading from "../../components/loading";
import PermissionGuard from "../../components/PermissionGuard";
const CompanyPage = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [refetch, setRefetch] = useState(false);

  /**
   * Safe 12-hour formatter.
   * Handles cases where time might be undefined or malformed.
   */
  const to12Hour = (time: string | undefined | null) => {
    if (!time || typeof time !== 'string' || !time.includes(':')) return time || "";

    const parts = time.split(':');
    const hour = parseInt(parts[0], 10);
    // Safety check: ensure parts[1] exists before calling methods on it
    const minPart = parts[1] ? parts[1].replace(/[^0-9]/g, '') : '00'; 
    const min = minPart.padStart(2, '0');

    if (isNaN(hour)) return time;

    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${min} ${period}`;
  };

  /**
   * Safe Support Hours formatter.
   * Expected format: "Mon-Fri 08:00-17:00"
   */
  const formatSupportHours = (hours: string | undefined | null) => {
    if (!hours || typeof hours !== 'string') return "N/A";

    const parts = hours.trim().split(/\s+/); // Splits by any whitespace
    if (parts.length < 2) return hours;

    const days = parts[0];
    const timeRange = parts[1];

    if (!timeRange.includes('-')) return hours;

    const [start, end] = timeRange.split('-');
    return `${days} ${to12Hour(start)} - ${to12Hour(end)}`;
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
  };

  useEffect(() => {
    const api = getApiClientInstance();

    const loadData = async () => {
      try {
        setLoading(true);
        const res = await api.get<SimpleApiResponse<Company>>("/permissions/get-company-detail");

        if (res.data?.success) {
          setCompany(res.data.data);
        } else {
          setCompany(null);
        }
      } catch (err) {
        console.error("Error loading company:", err);
        setCompany(null);
      } finally {
        setLoading(false);
        setRefetch(false);
      }
    };
    
    loadData();
  }, [refetch]);

  return (
    <section>
      <PageHeader title="Company">
        <PermissionGuard permission="Manage Company Settings">
        <div className="d-flex gap-2 align-items-center">
          <button
            className="btn btn-warning d-flex align-items-center gap-2 text-nowrap fw-bold"
            onClick={() => setShowEditModal(true)}
          >
            <FaRegEdit />
            Edit Company
          </button>
        </div>
        </PermissionGuard>
      </PageHeader>

      {loading ? (
        <Loading />
      ) : company ? (
        <section className="pt-4">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h5 className="card-title mb-4 fw-bold text-primary">{company.name}</h5>
              <div className="row g-4">
                <div className="col-md-6">
                  <p className="mb-2"><strong>Motto:</strong> {company.motto || "N/A"}</p>
                  <p className="mb-2"><strong>Farewell Message:</strong> {company.farewell_message || "N/A"}</p>
                  <p className="mb-2"><strong>Contact Number:</strong> {company.contact_number || "N/A"}</p>
                  <p className="mb-2"><strong>Contact Email:</strong> {company.contact_email || "N/A"}</p>
                  <p className="mb-2"><strong>Address:</strong> {company.address || "N/A"}</p>
                  <p className="mb-2">
                    <strong>VAT Rate:</strong> {company.vat_rate !== undefined && company.vat_rate !== null 
                      ? `${parseFloat(company.vat_rate.toString()).toFixed(1)}%` 
                      : "0.0%"}
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="mb-2"><strong>Bank Name:</strong> {company.bank_name || "N/A"}</p>
                  <p className="mb-2"><strong>Account Name:</strong> {company.bank_account_name || "N/A"}</p>
                  <p className="mb-2"><strong>Account Number:</strong> {company.bank_account_number || "N/A"}</p>
                  <p className="mb-2"><strong>Sort Code:</strong> {company.bank_sort_code || "N/A"}</p>
                  <p className="mb-2"><strong>Support Phone:</strong> {company.support_phone || "N/A"}</p>
                  <p className="mb-2"><strong>Support Hours:</strong> {formatSupportHours(company.support_hours)}</p>
                </div>
              </div>
              <hr className="my-4" />
              <div className="row">
                <div className="col-12">
                  <p className="mb-2">
                    <strong>Facebook:</strong> {company.facebook_url ? (
                      <a href={company.facebook_url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                        {company.facebook_url}
                      </a>
                    ) : "N/A"}
                  </p>
                  <p className="mb-0">
                    <strong>Instagram:</strong> {company.instagram_url ? (
                      <a href={company.instagram_url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                        {company.instagram_url}
                      </a>
                    ) : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="alert alert-info border-0 shadow-sm">No company data available.</div>
      )}

      <Modal show={showEditModal} onHide={handleCloseModal} centered size="lg" backdrop="static">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="h6 fw-bold">Edit Company Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <CompanyForm company={company} setRefetch={setRefetch} onClose={handleCloseModal} />
        </Modal.Body>
      </Modal>
    </section>
  );
};

export default CompanyPage;