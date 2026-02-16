"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { toast } from "react-toastify";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";

// 1. Created a separate component for the form logic
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Prefill from URL parameters
  const preEmail = searchParams.get("email") || "";
  const preToken = searchParams.get("token") || "";

  const [email, setEmail] = useState(preEmail);
  const [token, setToken] = useState(preToken);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Sync state if searchParams change after initial load
  useEffect(() => {
    if (preEmail) setEmail(preEmail);
    if (preToken) setToken(preToken);
  }, [preEmail, preToken]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setIsError(false);

    if (!email) {
      setMsg("Please enter your email.");
      setIsError(true);
      setLoading(false);
      return;
    }
    if (!token) {
      setMsg("Please enter the reset token sent to your email.");
      setIsError(true);
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setMsg("Password must be at least 8 characters.");
      setIsError(true);
      setLoading(false);
      return;
    }
    if (password !== passwordConfirmation) {
      setMsg("Passwords do not match.");
      setIsError(true);
      setLoading(false);
      return;
    }

    try {
      const api = getApiClientInstance();
      const payload = {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      };

      const res = await api.post("/users/reset-password", payload);

      if (res.data?.success) {
        toast.success(res.data.message || "Password reset successful!");
        setTimeout(() => router.push("/auth/login"), 2000);
      } else {
        setMsg(res.data?.message || "Something went wrong.");
        setIsError(true);
      }
    } catch (err: unknown) {
      const error = err as { 
        response?: { 
          data?: { 
            message?: string 
          } 
        } 
      };
      const serverMsg = error.response?.data?.message || "A network error occurred.";
      setMsg(serverMsg);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="col-md-6 col-lg-5 shadow p-4 rounded bg-white">
        <div className="d-flex justify-content-start mb-3">
          <button 
            type="button" 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => router.back()}
          >
            <i className="bi bi-arrow-left me-1"></i> Back
          </button>
        </div>
        
        <h3 className="mb-3 text-center text-primary">Reset Your Password</h3>

        {!preEmail && !loading && (
          <div className="alert alert-info py-2 tw-text-xs">No email was provided in the link — please enter your email below.</div>
        )}
        {!preToken && !loading && (
          <div className="alert alert-info py-2 tw-text-xs">No token found in the URL. If you received a token by email, paste it below.</div>
        )}

        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Token</label>
            <input
              type="text"
              className="form-control"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Reset token"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">New password</label>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword((s) => !s)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">Confirm new password</label>
            <div className="input-group">
              <input
                type={showConfirm ? "text" : "password"}
                className="form-control"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
              />
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowConfirm((s) => !s)}>
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button className="btn btn-danger w-100" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        {msg && (
          <div className={`mt-3 alert ${isError ? 'alert-danger' : 'alert-success'}`} role="alert">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}

// 2. Main export wrapped in Suspense to fix the Next.js build error
export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}