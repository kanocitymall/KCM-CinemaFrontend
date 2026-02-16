'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { IoDownloadOutline, IoClose } from 'react-icons/io5';
import { generateQRCodeImage } from '@/app/utils/ticketHelper';
import Loading from '../../components/loading';

interface QRCodeDisplayProps {
  qrCodeValue: string;
  bookingCode: string;
  seatLabel: string;
  customerName?: string;
  price?: string;
  onDownloadPDF?: (qrValue: string) => Promise<void>;
  size?: 'small' | 'medium' | 'large';
  showModal?: boolean;
  onClose?: () => void;
  program?: string;
  hall?: string;
  date?: string;
  starttime?: string;
  endtime?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  qrCodeValue,
  bookingCode,
  seatLabel,
  customerName,
  price,
  onDownloadPDF,
  showModal = false,
  onClose,
  program,
  hall,
  date,
  starttime,
  endtime,
}) => {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(showModal);

  // Guard: If data is essentially empty/loading, don't show "N/A"
  const isInitialLoading = !program || program === 'N/A';

  useEffect(() => {
    setIsOpen(showModal);
  }, [showModal]);

  const loadQRCode = React.useCallback(async () => {
    if (!qrCodeValue) return;
    try {
      setLoading(true);
      const dataUrl = await generateQRCodeImage(qrCodeValue);
      setQrImage(dataUrl);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
      toast.error('Failed to load QR code');
    } finally {
      setLoading(false);
    }
  }, [qrCodeValue]);

  useEffect(() => {
    if ((isOpen && !qrImage) || (!showModal && !qrImage)) {
      loadQRCode();
    }
  }, [isOpen, qrImage, showModal, loadQRCode]);

  const handleDownload = async () => {
    if (onDownloadPDF) {
      try {
        await onDownloadPDF(qrCodeValue);
      } catch (err) {
        console.error('Download failed:', err);
        toast.error('Failed to download QR code');
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  // --- 1. Inline Render (Non-Modal) ---
  if (!showModal) {
    if (isInitialLoading) {
      return (
        <div className="qr-code-display text-center p-4 border rounded bg-light">
          <div style={{ width: '150px', margin: '0 auto' }}>
             <Loading />
          </div>
          <p className="small text-muted mt-2">Loading ticket details...</p>
        </div>
      );
    }

    return (
      <div className="qr-code-display text-center p-3 border rounded bg-light">
        <div className="d-flex flex-column gap-2 align-items-center text-start">
          <div className="small text-muted w-100">
            <strong>Program:</strong> {program} <br />
            <strong>Hall:</strong> {hall} <br />
            <strong>Date:</strong> {date} <br />
            <strong>Time:</strong> {starttime}{endtime ? ` - ${endtime}` : ''}
          </div>
          <div className="w-100 d-flex justify-content-center">
            {onDownloadPDF ? (
              <button 
                onClick={handleDownload} 
                className="btn btn-sm btn-success d-flex align-items-center gap-1"
              >
                <IoDownloadOutline size={14} /> Download PDF
              </button>
            ) : (
              <div className="small text-muted">QR code hidden</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- 2. Modal Render ---
  if (!isOpen) return null;

  return (
    <div 
      className="modal fade show" 
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
      role="dialog"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0">
            <h5 className="modal-title">Ticket: {bookingCode}</h5>
            <button type="button" className="btn-close" onClick={handleClose} />
          </div>
          <div className="modal-body text-center">
            {loading || isInitialLoading ? (
              <Loading />
            ) : (
              <div className="alert alert-info text-start">
                <strong>Program:</strong> {program}<br />
                <strong>Hall:</strong> {hall}<br />
                <strong>Date:</strong> {date}<br />
                <strong>Time:</strong> {starttime} {endtime ? `- ${endtime}` : ''}
                <hr />
                <strong>Seat:</strong> {seatLabel}<br />
                {customerName && (
                  <>
                    <strong>Customer:</strong> {customerName}<br />
                  </>
                )}
                {price && (
                  <>
                    <strong>Price:</strong> {price}
                  </>
                )}
              </div>
            )}
          </div>
          <div className="modal-footer border-0">
            {onDownloadPDF && (
              <button 
                onClick={handleDownload} 
                className="btn btn-success d-flex align-items-center gap-1"
              >
                <IoDownloadOutline size={16} /> Download PDF
              </button>
            )}
            <button className="btn btn-secondary" onClick={handleClose}>
              <IoClose size={16} /> Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;