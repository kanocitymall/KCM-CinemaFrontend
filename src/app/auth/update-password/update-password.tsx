"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { authActions } from "@/store/features/auth";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

export default function UpdatePassword() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const hasDefaultPassword = useSelector((state: RootState) => state.auth.main.hasDefaultPassword);
  const user = useSelector((state: RootState) => state.auth.main.user);

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    if (hasDefaultPassword) {
      setCurrentPassword("123456789");
    }
  }, [hasDefaultPassword]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setIsError(false);

    // Client-side validation
    if (!currentPassword && !hasDefaultPassword) {
      setMsg("Please enter your current password.");
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
        current_password: hasDefaultPassword ? "123456789" : currentPassword,
        new_password: password,
        confirm_password: passwordConfirmation,
      };

      const res = await api.post(`/users/update-password/${user?.id}`, payload);
      const data = res.data;

      if (data.success) {
        setIsError(false);
        dispatch(authActions.main.clearDefaultPasswordFlag());
        toast.success(data.message || "Password updated successfully.");
        setTimeout(() => router.push("/dashboard"), 1200);
      } else {
        setMsg(data.message || "Update failed");
        setIsError(true);
      }
    } catch (err: unknown) {
      console.error(err);
      const error = err as { 
        response?: { 
          status?: number; 
          data?: { message?: string } 
        } 
      };

      if (error.response?.status === 401) {
        dispatch(authActions.main.logoutUser());
        router.push("/auth/login");
        return;
      }
      
      if (error.response?.status === 403) {
        setHasPermission(false);
        return;
      }

      const serverMsg = error.response?.data?.message || "A network error occurred.";
      setMsg(serverMsg);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      {hasPermission ? (
        <div className="col-md-6 col-lg-5 shadow p-4 rounded bg-white">
          <div className="d-flex justify-content-start mb-3">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                dispatch(authActions.main.logoutUser());
                router.push("/auth/login");
              }}
            >
              Cancel
            </button>
          </div>
          <h2 className="text-center mb-4">Update Password</h2>
          <p className="text-center text-muted mb-4">
            You are using the default password. Please update it to continue.
          </p>
          <form onSubmit={submit}>
            <div className="mb-3">
              <label htmlFor="currentPassword" className="form-label">Current Password</label>
              <div className="input-group">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  className="form-control"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={hasDefaultPassword}
                />
                <span className="input-group-text" onClick={() => setShowCurrentPassword(!showCurrentPassword)} style={{ cursor: 'pointer' }}>
                  {showCurrentPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </span>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">New Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span className="input-group-text" onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }}>
                  {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </span>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="passwordConfirmation" className="form-label">Confirm New Password</label>
              <div className="input-group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  id="passwordConfirmation"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                />
                <span className="input-group-text" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ cursor: 'pointer' }}>
                  {showConfirmPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </span>
              </div>
            </div>

            {msg && (
              <div className={`alert ${isError ? "alert-danger" : "alert-success"}`}>
                {msg}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      ) : (
        <div className="text-center">
          <p>You do not have permission to access this page.</p>
        </div>
      )}
    </div>
  );
}