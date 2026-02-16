"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { toast } from 'react-toastify';

// --- Props ---
export interface ForgotPasswordProps {
  open: boolean;
  onClose: () => void;
}

// --- Component ---
const ForgotPassword: React.FC<ForgotPasswordProps> = ({ open, onClose }) => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // --- Submit Forgot Password ---
  const submitForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(""); 
    setIsError(false);

    const values = { email }; 

    try {
      const api = getApiClientInstance();
      const res = await api.post("/users/forgot-password", values);

      if (res.status === 200 && (res.data?.success === true || res.status === 200)) {
        const successMessage = res.data?.message || 'If the email exists, a reset link has been sent.';
        setMessage(successMessage);
        setIsError(false);
        toast.success(successMessage);

        // Redirect to reset page with email prefilled
        router.push(`/auth/reset-password?email=${encodeURIComponent(values.email)}`);
        setEmail("");
        onClose();
      }
      
    } catch (err: unknown) {
      console.error('Forgot password error:', err);
      
      let errorMessage = 'Failed to request password reset.';

      // FIXED: Defined the error shape to avoid "any"
      const error = err as { 
        response?: { 
          status?: number; 
          data?: { message?: string } 
        } 
      };

      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Endpoint not found (404). Check API base URL.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else {
        errorMessage = 'Network error. Please try again.';
      }
      
      setMessage(errorMessage);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <button style={closeButton} onClick={onClose}>
          &times;
        </button>

        <div style={headerContainer}>
          <span style={iconStyle}>🔒</span>
          <h4 style={{ margin: 0, fontWeight: 600 }}>Forgot Password</h4>
        </div>

        <p style={instructions}>
          Enter the email associated with your account to receive your reset link.
        </p>

        <form onSubmit={submitForgotPassword}>
          <input
            type="email"
            required
            style={inputStyle}
            placeholder="Your registered email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <button style={buttonStyle} disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        
        {message && (
          <p style={isError ? messageErrorStyle : messageSuccessStyle}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

// --- Styles ---
const PRIMARY_COLOR = "#aa1c2aff";
const ACCENT_COLOR = "#6c757d";

const backdrop: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modal: React.CSSProperties = {
  position: "relative",
  width: "380px",
  maxWidth: "90%",
  background: "#ffffff",
  padding: "30px",
  borderRadius: "15px",
  boxShadow: "0 15px 30px rgba(0,0,0,0.2), 0 5px 10px rgba(0,0,0,0.1)",
  display: "flex",
  flexDirection: "column",
  gap: "15px",
};

const headerContainer: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  marginBottom: "10px",
};

const iconStyle: React.CSSProperties = { fontSize: "24px" };

const instructions: React.CSSProperties = {
  color: ACCENT_COLOR,
  textAlign: "center",
  fontSize: "0.95rem",
  marginBottom: "20px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 15px",
  marginBottom: "15px",
  border: "1px solid #ced4da",
  borderRadius: "8px",
  fontSize: "16px",
  outline: "none",
  backgroundColor: "#f8f9fa",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  backgroundColor: PRIMARY_COLOR,
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "16px",
  fontWeight: 600,
  cursor: "pointer",
};

const closeButton: React.CSSProperties = {
  position: "absolute",
  top: "10px",
  right: "15px",
  background: "none",
  border: "none",
  fontSize: "24px",
  color: ACCENT_COLOR,
  cursor: "pointer",
};

const messageBaseStyle: React.CSSProperties = {
  marginTop: "15px",
  padding: "10px 15px",
  borderRadius: "8px",
  textAlign: "center",
  fontSize: "0.9rem",
  fontWeight: 500,
};

const messageSuccessStyle: React.CSSProperties = {
  ...messageBaseStyle,
  backgroundColor: "#d4edda",
  color: "#155724",
};

const messageErrorStyle: React.CSSProperties = {
  ...messageBaseStyle,
  backgroundColor: "#f8d7da",
  color: "#721c24",
};