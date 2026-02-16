'use client';
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeCameraScanConfig, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { appConfig } from "../../../utils/config";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";

export interface Participant {
  id: number;
  name: string;
  checkin_status: "checked_in" | "not_checked_in";
  qr_code: string;
  booking_id: number;
  created_at: string;
  updated_at: string;
}

interface QRScannerProps {
  scheduleId?: number | null;
  bookingId?: number | null;
  onSuccessfulScan: (scannedData: unknown) => void;
}

interface CheckInResponse {
  success: boolean;
  data?: unknown; // Updated to handle the nested Seat/Booking object
  message: string;
}

interface CheckInRequest {
  qr_code: string;
  schedule_id?: number | null;
}

const QRScanner: React.FC<QRScannerProps> = ({ scheduleId = null, bookingId = null, onSuccessfulScan }) => {
  // Debug: Log the scheduleId prop whenever it changes
  useEffect(() => {
    console.log("CameraScanner received scheduleId:", scheduleId);
  }, [scheduleId]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onScanSuccessRef = useRef<((text: string) => Promise<void>) | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const restartTimeRef = useRef<NodeJS.Timeout | null>(null);
  const [status, setStatus] = useState<"initializing" | "scanning" | "error" | "stopped">("initializing");
  const [overlayMessage, setOverlayMessage] = useState("");
  const [overlayVariant, setOverlayVariant] = useState<"success" | "error" | "info" | "warning" | "">("");

  const stopScanner = useCallback(async () => {
    if (isStoppingRef.current) return; // Prevent concurrent stops
    
    isStoppingRef.current = true;
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        setStatus("stopped");
      } catch (err: unknown) {
        console.error("Error stopping scanner:", err);
      } finally {
        isStoppingRef.current = false;
      }
    }
  }, []);

  const restartScannerDelayed = useCallback(() => {
    // Clear any pending restart
    if (restartTimeRef.current) {
      clearTimeout(restartTimeRef.current);
    }

    restartTimeRef.current = setTimeout(() => {
      setOverlayMessage("");
      setOverlayVariant("");
      
      // Wait for scanner to fully stop before restarting
      setTimeout(async () => {
        if (onScanSuccessRef.current && scannerRef.current && !isStoppingRef.current) {
          try {
            await scannerRef.current.start(
              { facingMode: "environment" },
              { fps: 30, qrbox: { width: 280, height: 200 }, aspectRatio: 1.0 },
              onScanSuccessRef.current,
              (err) => console.debug("Scan noise:", err)
            );
            setStatus("scanning");
          } catch (err) {
            console.error("Error restarting scanner:", err);
            toast.error("Failed to restart scanner");
          }
        }
      }, 800);
    }, 2500);
  }, []);

  const onScanSuccess = useCallback(async (decodedText: string) => {
    // Prevent concurrent scans
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    // Immediate feedback: stop and notify
    await stopScanner();
    toast.info("Processing...");

    const token = Cookies.get(appConfig.authToken);
    if (!token) {
      setOverlayMessage("Login required.");
      setOverlayVariant("error");
      isProcessingRef.current = false;
      restartScannerDelayed();
      return;
    }

    const qrPayload = (decodedText || '').trim();
    console.log("QR Scanned:", { qrPayload, scheduleId, bookingId });

    try {
      let finalScheduleId = scheduleId;
      
      // If no scheduleId, try to fetch it using bookingId
      if (!finalScheduleId && bookingId) {
        console.log("No scheduleId provided, fetching from bookingId:", bookingId);
        try {
          const api = getApiClientInstance();
          const bookingRes = await api.get(`/bookings/${bookingId}`);
          const booking = bookingRes?.data?.data || bookingRes?.data;
          console.log("Booking fetched:", booking);
          
          finalScheduleId = booking?.schedule_id || booking?.schedule?.id || null;
          
          // If still no schedule_id, fetch schedules and match
          if (!finalScheduleId && booking?.date && booking?.program_id) {
            const schedulesRes = await api.get('/schedules', { 
              params: { 
                date: booking.date, 
                program_id: booking.program_id,
                paginate: false 
              } 
            });
            const schedules = schedulesRes?.data?.data || schedulesRes?.data || [];
            if (Array.isArray(schedules) && schedules.length > 0) {
              finalScheduleId = schedules[0].id;
              console.log("Matched schedule_id from booking date/program:", finalScheduleId);
            }
          }
        } catch (fetchErr: unknown) {
          const err = fetchErr as { message?: string; response?: { status?: number } };
          console.error("Failed to fetch schedule from booking:", { 
            message: err?.message,
            status: err?.response?.status
          });
        }
      }

      const requestBody: CheckInRequest = { qr_code: qrPayload };
      if (finalScheduleId) {
        requestBody.schedule_id = finalScheduleId;
      }

      console.log("Check-in request body:", requestBody);

      const response = await fetch(
        "https://cinemaapi.kanocitymall.com.ng/api/v1/bookings/checkin-by-qr",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const resData: CheckInResponse = await response.json();
      console.log("Check-in response:", resData);

      if (resData.success) {
        setOverlayMessage("Check-in Successful! 🎉");
        setOverlayVariant("success");
        onSuccessfulScan(resData.data);
        isProcessingRef.current = false;
        restartScannerDelayed();
      } else {
        setOverlayMessage(resData.message || "Failed");
        setOverlayVariant("error");
        toast.error(resData.message || "Check-in failed");
        isProcessingRef.current = false;
        restartScannerDelayed();
      }
    } catch (err: unknown) {
      console.error("Check-in error:", err);
      setOverlayMessage("Network Error");
      setOverlayVariant("error");
      toast.error("Network error during check-in");
      isProcessingRef.current = false;
      restartScannerDelayed();
    }
  }, [scheduleId, bookingId, onSuccessfulScan, stopScanner, restartScannerDelayed]);

  // Update ref whenever onScanSuccess changes
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    if (scannerRef.current.isScanning) return;

    const config: Html5QrcodeCameraScanConfig = { 
      fps: 30,
      qrbox: { width: 280, height: 200 },
      aspectRatio: 1.0
    };
    
    try {
      await scannerRef.current.start(
        { facingMode: "environment" }, 
        config, 
        onScanSuccessRef.current || (() => {}),
        (err) => console.debug("Scan noise:", err)
      );
      setStatus("scanning");
    } catch (err: unknown) {
      const error = err as { message?: string };
      setStatus("error");
      toast.error(error.message || "Camera failed.");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initScanner = async () => {
      if (!containerRef.current) return;
      
      const html5QrCode = new Html5Qrcode("qr-reader", {
        verbose: false,
        formatsToSupport: [ 
          Html5QrcodeSupportedFormats.QR_CODE, 
          Html5QrcodeSupportedFormats.CODE_128 
        ]
      });
      
      if (isMounted) {
        scannerRef.current = html5QrCode;
        startScanner();
      }
    };

    initScanner();
    
    return () => {
      isMounted = false;
      if (restartTimeRef.current) {
        clearTimeout(restartTimeRef.current);
      }
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [startScanner]);

  const renderOverlay = () => {
    if (overlayMessage) {
      const colors = { success: "#28a745", error: "#dc3545", info: "#007bff", warning: "#ffc107", "": "#000" };
      return <p style={{ color: colors[overlayVariant || ""], fontWeight: 700, fontSize: '1.1rem' }}>{overlayMessage}</p>;
    }
    return (
      <div style={{ color: "#fff", textShadow: "0 0 8px #000" }}>
        {status === "scanning" ? (
          <div>
            <div className="mb-2">Center QR Code inside the box</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Scanning live...</div>
          </div>
        ) : "Initializing Camera..."}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "min(100%, 400px)", height: "auto", aspectRatio: "1", position: "relative", margin: "10px auto",
        border: `4px solid ${status === "scanning" ? "#28a745" : "#6c757d"}`,
        borderRadius: "16px", overflow: "hidden", backgroundColor: "#000",
      }}
    >
      <div id="qr-reader" style={{ width: "100%", height: "100%" }} />
      <div style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        textAlign: "center", pointerEvents: "none",
        backgroundColor: overlayMessage ? "rgba(255,255,255,0.8)" : "transparent",
      }}>
        {renderOverlay()}
      </div>
    </div>
  );
};

export default QRScanner;