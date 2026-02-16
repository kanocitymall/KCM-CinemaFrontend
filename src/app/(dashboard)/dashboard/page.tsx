"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { toast } from "react-toastify";
import { MdPerson, MdLock, MdLogout, MdVisibility, MdVisibilityOff, MdAccessTime, MdEventNote } from "react-icons/md";
import { appConfig } from "@/app/utils/config";
import Cookies from "js-cookie";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import  PermissionGuard  from "../components/PermissionGuard";

// Removed unused User interface to fix warning

interface Booking {
  id: number;
  code: string;
  title: string;
  status: string;
  date: string;
  // ... add other booking properties as needed
}

// This interface handles the nested structure: res.data.data.data and res.data.data.total
interface PaginatedData {
  data?: Booking[];
  total?: number;
  meta?: { total?: number };
  pagination?: { total?: number };
}

interface RawApiResponse {
  data?: {
    data?: Booking[] | PaginatedData;
    total?: number;
    meta?: { total?: number };
    pagination?: { total?: number };
  };
}

const extractTotalCount = (res: RawApiResponse): number => {
  const data = res?.data;
  
  // Safely check if data.data is the paginated object containing the total
  const nestedTotal = (data?.data as PaginatedData)?.total;

  const total = Number(
    nestedTotal ??
    data?.total ??
    data?.meta?.total ??
    data?.pagination?.total ??
    0
  );
  
  return total;
};

const extractBookingsArray = (res: RawApiResponse): Booking[] => {
  const data = res?.data;
  let bookingsArray: Booking[] = [];

  if (data) {
    const innerData = data.data;
    if (Array.isArray(innerData)) {
      bookingsArray = innerData;
    } else if (innerData && typeof innerData === 'object') {
      const nestedData = (innerData as PaginatedData).data;
      if (Array.isArray(nestedData)) {
        bookingsArray = nestedData;
      }
    } else if (Array.isArray(data)) {
      bookingsArray = data as unknown as Booking[];
    }
  }
  
  return bookingsArray; // Ensure this return is here!
};

interface AuthUser {
  id: number;
  name?: string;
  email?: string;
  phoneNo?: string;
  address?: string;
  state_id?: number;
  role?: { name?: string };
  permissions?: { name: string }[];
  customer?: { id?: number };
}

interface PagaBooking {
  title?: string;
  code: string;
  date: string;
  amountpaid?: number;
  dueamount?: number;
  amount?: number;
}

interface Customer {
  id: number | string;
  name?: string;
  email?: string;
  phone?: string;
}

interface Booking {
  id: number;
  code: string;
  title: string;
  status: string;
  date: string;
  user_id?: string | number;
  created_by?: string | number;
  client_id?: string | number;
  client?: Customer;
  name?: string;
  hall_name?: string;
  booking_time?: string;
  processing_date?: string;
}
export default function Dashboard() {
  const router = useRouter();
  const [, setBookings] = useState<Booking[]>([]);
  const [loadingTodayBookings, setLoadingTodayBookings] = useState(true);
  const [, setLoadingTotalBookings] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const authUser = useSelector((state: RootState) => state.auth.main.user) as AuthUser | null;

  // Status totals and today counts removed per request

  // Schedule statistics state
  const [scheduleStats, setScheduleStats] = useState({
    today: 0,
    scheduled: 0,
    canceled: 0,
    completed: 0
  });
  const [loadingScheduleStats, setLoadingScheduleStats] = useState(true);

  const getInitials = (nameOrEmail?: string | null) => {
    if (!nameOrEmail) return "U";
    const parts = nameOrEmail.split(/\s+|@/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
  };

  // Permission helpers
  const isSuperAdmin = authUser?.role?.name?.toLowerCase() === "super admin";
  const hasPermission = (keyword: string | string[]) => {
    const keywords = Array.isArray(keyword) ? keyword : [keyword];
    return authUser?.permissions?.some(p => 
      keywords.some(k => p.name.toLowerCase().includes(k.toLowerCase()))
    ) ?? false;
  };
  const canCreateEvent = isSuperAdmin || hasPermission(["booking", "create"]);

  const [, setTotalBookings] = useState<number>(0);
  // total services not used in dashboard overview
  // const [, setLoadingServices] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Paga modal state (kept for future integration)
  const [showPagaModal, setShowPagaModal] = useState(false);
  const [pagaBooking,] = useState<PagaBooking | null>(null);
  
  // Update Profile Modal State
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phoneNo: "",
    address: "",
    email: ""
  });


  // --- Data Fetching Logic with LocalStorage Caching ---

  // Helper to get cached data
  const getCachedData = (key: string) => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        const now = Date.now();
        const cacheTime = parsed.timestamp || 0;
        // Cache for 5 minutes (300000 ms)
        if (now - cacheTime < 300000) {
          return parsed.data;
        }
      }
    } catch (e) {
      console.warn("Failed to read from localStorage:", e);
    }
    return null;
  };

  // Helper to set cached data
  const setCachedData = (key: string, data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn("Failed to write to localStorage:", e);
    }
  };

  // Fetch status totals by fetching all bookings and filtering
  const fetchScheduleStats = useCallback(async () => {
    const cacheKey = "dashboard_schedule_stats";
    const cached = getCachedData(cacheKey);
    if (cached) {
      setScheduleStats(cached);
      setLoadingScheduleStats(false);
      return;
    }

    try {
      setLoadingScheduleStats(true);
      const api = getApiClientInstance();

      // Fetch all schedules
      const res = await api.get("/bookings/schedules?status=All");
      const schedules = res?.data?.data?.data || res?.data?.data || [];
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Calculate stats
      const stats = {
        today: schedules.filter((s: { date?: string; status?: string }) => (s.date || '').startsWith(today)).length,
        scheduled: schedules.filter((s: { date?: string; status?: string }) => s.status === 'Scheduled').length,
        canceled: schedules.filter((s: { date?: string; status?: string }) => s.status === 'Canceled' || s.status === 'Cancelled').length,
        completed: schedules.filter((s: { date?: string; status?: string }) => s.status === 'Completed').length
      };

      setScheduleStats(stats);
      setCachedData(cacheKey, stats);
    } catch (err: unknown) {
      console.error("Failed to fetch schedule stats:", err);
      toast.error("Failed to load schedule statistics");
    } finally {
      setLoadingScheduleStats(false);
    }
  }, []);

  // Status totals removed — feature intentionally deleted per request

  useEffect(() => {
    const fetchAllBookings = async () => {
      // Check cache for bookings data
      const bookingsCacheKey = "dashboard_bookings_data";
      const totalCacheKey = "dashboard_total_bookings";

      const cachedBookings = getCachedData(bookingsCacheKey);
      const cachedTotal = getCachedData(totalCacheKey);

      if (cachedBookings && cachedTotal !== null) {
        setBookings(cachedBookings);
        setTotalBookings(cachedTotal);
        setLoadingTodayBookings(false);
        setLoadingTotalBookings(false);
        return;
      }

      setLoadingTodayBookings(true);
      setLoadingTotalBookings(true);
      try {
        const api = getApiClientInstance();
        
        // First fetch to get pagination info
        // Build params to prefer agent_id/customer_id/user_id when applicable
        const params = buildRoleParams();

        const res = await api.get("/bookings", { params });
        console.log("All bookings full response:", res);
        
        let bookingsArray = extractBookingsArray(res);
        console.log("Parsed bookings from page 1:", bookingsArray);
        console.log("Bookings count:", bookingsArray.length);
        
        // Get total pages from response
        const totalPages = res?.data?.last_page || 1;
        console.log("Total pages:", totalPages);
        
        // Fetch remaining pages if more than 1 page
        if (totalPages > 1) {
          for (let page = 2; page <= totalPages; page++) {
            try {
              const pageParams = { ...params, page };
              const pageRes = await api.get("/bookings", { params: pageParams });
              const pageBookings = extractBookingsArray(pageRes);
              bookingsArray = [...bookingsArray, ...pageBookings];
              console.log(`Fetched page ${page}, total bookings so far:`, bookingsArray.length);
            } catch {
              // Silently handle page fetch error
            }
          }
        }
        
        console.log("Final total bookings fetched:", bookingsArray.length);
        
        // 🔒 Customer filtering: if user is a customer, show only their own bookings
        const isCustomer = String(authUser?.role?.name || '').toLowerCase().includes('customer');
        if (!isSuperAdmin && isCustomer && authUser?.id) {
          bookingsArray = bookingsArray.filter((b) => {
            // Check if booking belongs to this customer by ID
            const bookingClientId = b.client_id ?? b.client?.id ?? null;
            const userClientId = authUser?.customer?.id ?? null;
            
            if (bookingClientId && userClientId && Number(bookingClientId) === Number(userClientId)) {
              return true;
            }

            // Also check if booking is created by this customer user
            if (b.user_id === authUser.id || b.created_by === authUser.id) {
              return true;
            }
            
            return false;
          });
        }
        
        setBookings(bookingsArray);
        setCachedData(bookingsCacheKey, bookingsArray);
        
        // Status totals removed — no separate fetch
        
        // Calculate total from the response
        const total = extractTotalCount(res);
        console.log("Total count:", total);
        setTotalBookings(total);
        setCachedData(totalCacheKey, total);
        // (moved) today's bookings are now fetched lazily when the modal opens
      } catch {
        // Silently handle error
        setBookings([]);
        setTotalBookings(0);
      } finally {
        setLoadingTodayBookings(false);
        setLoadingTotalBookings(false);
      }
    };

    fetchAllBookings();
    fetchScheduleStats();

    if (authUser?.id) {
      setUserId(String(authUser.id));
    } else {
      const storedUserId = localStorage.getItem("userId");
      if (storedUserId) setUserId(storedUserId);
    }
  }, [authUser?.id, fetchScheduleStats, authUser, isSuperAdmin]);
  const handleLogout = async () => {
    const api = getApiClientInstance();
    const reportError = (err: unknown) => {
      console.error("Logout failed:", err);
      // Line 337
const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || "Logout failed";
      toast.error(msg);
    };

    try {
      let res;
      try {
        res = await api.post("/users/logout");
      } catch {
        try {
          res = await api.get("/users/logout"); // Fallback to GET if POST fails
        } catch {
          // If both fail, proceed with local logout
        }
      }

      // Always perform local logout
      try { Cookies.remove(appConfig.authToken); } catch {}
      try { localStorage.removeItem("userId"); } catch {}
      setProfileOpen(false);
      router.push("/auth/login");

      if (res && (res.status === 200 || res.data?.success)) {
        toast.success(res.data?.message || "Logged out successfully");
      } else {
        reportError(res?.data || new Error("Logout failed"));
      }
    } catch (err: unknown) {
      // Even on error, perform local logout
      try { Cookies.remove(appConfig.authToken); } catch {}
      try { localStorage.removeItem("userId"); } catch {}
      setProfileOpen(false);
      router.push("/auth/login");
      reportError(err);
    }
  };

  const openChangePassword = () => {
    setProfileOpen(false);
    setShowChangePasswordModal(true);
  };

  const openUpdateProfile = async () => {
    setProfileOpen(false);
    setShowUpdateProfileModal(true);
    // Fetch fresh user data from API to get current address and state_id
    if (userId) {
      try {
        const api = getApiClientInstance();
        const res = await api.get(`/users/get-user/${userId}`);
        const userData = res?.data?.data || {};
        setProfileForm({
          name: userData?.name || authUser?.name || "",
          phoneNo: userData?.phoneNo || authUser?.phoneNo || "",
          address: userData?.address || "",
          email: userData?.email || authUser?.email || ""
        });
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        // Fallback to Redux auth state
        setProfileForm({
          name: authUser?.name || "",
          phoneNo: authUser?.phoneNo || "",
          address: authUser?.address || "",
          email: authUser?.email || ""
        });
      }
    }
  };



  const handleUpdateProfile = async () => {
    if (!userId) return toast.error("User not found");
    if (!profileForm.name.trim()) return toast.error("Name is required");
    if (!profileForm.email.trim()) return toast.error("Email is required");

    setUpdatingProfile(true);
    try {
      const api = getApiClientInstance();
      const payload = {
        name: profileForm.name,
        phoneNo: profileForm.phoneNo,
        address: profileForm.address,
        email: profileForm.email
      };
      const res = await api.put(`/users/update-profile/${userId}`, payload);
      if (res?.status === 200 || res?.data?.success) {
        toast.success("Profile updated successfully");
        setShowUpdateProfileModal(false);
      } else {
        toast.error(res?.data?.message || "Failed to update profile");
      }
    } catch (err: unknown) {
      console.error("Update profile failed:", err);
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!userId) return toast.error("User not found");
    if (!currentPassword || !newPassword || !confirmPassword) return toast.error("All fields are required");
    if (newPassword.length < 8) return toast.error("New password must be at least 8 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");

    setChangingPassword(true);
    try {
      const api = getApiClientInstance();
      const payload = {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      };
      const res = await api.post(`/users/update-password/${userId}`, payload);
      if (res?.status === 200 || res?.data?.success) {
        toast.success("Password updated successfully");
        setShowChangePasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res?.data?.message || "Failed to update password");
      }
    } catch (err: unknown) {
      console.error("Change password failed:", err);
     // Line 389
toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  // Helper to compute params for bookings endpoints based on current user role
  const buildRoleParams = () => {
    const params: Record<string, unknown> = {};
    // Note: Removed agent_id/client_id params as they cause API validation errors
    // Will rely on customer-side filtering instead
    return params;
  };

  // Helper component for loading/no data (Improved icons)
  const LoadingOrData = ({ isLoading, value }: { isLoading: boolean, value: number }) => {
    if (isLoading) {
      return <div className="spinner-border spinner-border-sm text-secondary" role="status"><span className="visually-hidden">Loading...</span></div>;
    }
    if (value === 0) {
      return <span className="text-muted d-flex align-items-center" style={{ fontSize: '1.9rem' }}>0</span>;
    }
    return <span style={{ fontSize: '1.9rem' }}>{value}</span>;
  };

  const getKpiData = (status: string) => {
    // Schedule statistics
    if (status === 'schedule-today') {
      return {
        count: scheduleStats.today,
        title: "Today Schedules",
        subtitle: "Scheduled for today",
        icon: MdEventNote,
        color: '#17a2b8',
        bgColor: 'bg-info bg-opacity-10'
      };
    }
    if (status === 'schedule-scheduled') {
      return {
        count: scheduleStats.scheduled,
        title: "Total Scheduled",
        subtitle: "Scheduled events",
        icon: MdEventNote,
        color: '#198754',
        bgColor: 'bg-success bg-opacity-10'
      };
    }
    if (status === 'schedule-canceled') {
      return {
        count: scheduleStats.canceled,
        title: "Canceled",
        subtitle: "Cancelled schedules",
        icon: MdEventNote,
        color: '#dc3545',
        bgColor: 'bg-danger bg-opacity-10'
      };
    }
    if (status === 'schedule-completed') {
      return {
        count: scheduleStats.completed,
        title: "Completed",
        subtitle: "Completed schedules",
        icon: MdEventNote,
        color: '#6f42c1',
        bgColor: 'bg-secondary bg-opacity-10'
      };
    }
    return { count: 0, title: "", subtitle: "", icon: MdAccessTime, color: '#aa1c2a', bgColor: 'bg-light' };
  };

  const KpiCard = ({ status, isLoading }: { status: 'schedule-today' | 'schedule-scheduled' | 'schedule-canceled' | 'schedule-completed', isLoading: boolean }) => {
    const data = getKpiData(status);
    const Icon = data.icon;
    const handleClick = status === 'schedule-today' ? () => router.push('/schedule/schedule-list?filter=today')
      : status === 'schedule-scheduled' ? () => router.push('/schedule/schedule-list?filter=scheduled')
      : status === 'schedule-canceled' ? () => router.push('/schedule/schedule-list?filter=canceled')
      : status === 'schedule-completed' ? () => router.push('/schedule/schedule-list?filter=completed')
      : undefined;

    return (
        <div className={`col-sm-6 col-md-3 ${handleClick ? 'cursor-pointer' : ''}`} onClick={handleClick}>
            <div className="card shadow-sm h-100 border-0 transition-300 hover-shadow">
                <div className="card-body">
                    <div className="d-flex align-items-center">
                        <div className={`me-3 p-3 rounded-3 ${data.bgColor}`} style={{ color: data.color }}>
                            <Icon size={24} />
                        </div>
                        <div>
                            <h6 className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>{data.title}</h6>
                            <h3 className="mb-0 mt-1 fw-bold" style={{ color: data.color, lineHeight: '1' }}>
                                <LoadingOrData 
                                    isLoading={isLoading} 
                                    value={data.count} 
                                />
                            </h3>
                            <small className="text-muted">{data.subtitle}</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };
  // --- End KpiCard Component ---


  return (
    <div className="min-vh-100 p-4" style={{ background: '#f8f9fa' }}> {/* Lighter background */}
      {/* Mobile menu spacing wrapper */}
      <div className="d-lg-none" style={{ paddingLeft: '68px', paddingRight: '16px', position: 'relative', zIndex: 100 }}>
        <div className="d-flex align-items-center justify-content-between mb-5 pt-4 border-bottom pb-3">
          <div>
            <h1 className="mb-1 fw-light">Dashboard</h1> {/* Reduced visual weight */}
            <p className="text-secondary mb-0">Here&apos;s a summary of your cinema activity.</p>
          </div>
          <div className="d-flex flex-column gap-3 align-items-end">
            {/* Profile icon on top for mobile */}
              <div className="position-relative" style={{ zIndex: 500 }}>
              {/* Cleaner profile button */}
              <button
                className="btn btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center"
                onClick={() => setProfileOpen(p => !p)}
                aria-expanded={profileOpen}
                style={{ width: 40, height: 40 }}
              >
                <MdPerson size={20} />
              </button>
            </div>
              {canCreateEvent && (
                <button className="btn btn-warning d-flex align-items-center gap-2 text-nowrap" onClick={() => router.push("/schedule/schedule-list")}>
                  Buy Ticket
                </button>
              )}

              {profileOpen && (
                <div
                  className="card shadow-lg position-fixed border-0"
                  style={{ width: 280, zIndex: 600, borderRadius: '10px', top: '80px', right: '20px' }}
                  onMouseLeave={() => setProfileOpen(false)} // Optional: close on mouse leave
                >
                  <div className="card-body py-3 border-bottom">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, fontWeight: 600 }}>
                        {getInitials(authUser?.name ?? authUser?.email)}
                      </div>
                      <div>
                        <div className="fw-bold">{authUser?.name ?? "User"}</div>
                        <div className="text-muted d-flex align-items-center gap-1" style={{ fontSize: "0.8rem" }}>{authUser?.email ?? ""}</div>
                      </div>
                    </div>
                  </div>
                  <div className="list-group list-group-flush">
                    <button className="list-group-item list-group-item-action d-flex align-items-center gap-3 py-2" onClick={() => openUpdateProfile()}>
                      <MdPerson size={20} className="text-primary" />
                      <span className="fw-medium">Update Profile</span>
                    </button>
                    <button className="list-group-item list-group-item-action d-flex align-items-center gap-3 py-2" onClick={() => openChangePassword()}>
                      <MdLock size={20} className="text-secondary" />
                      <span className="fw-medium">Change Password</span>
                    </button>
                    <button className="list-group-item list-group-item-action d-flex align-items-center gap-3 py-2 text-danger" onClick={() => handleLogout()}>
                      <MdLogout size={20} />
                      <span className="fw-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Desktop header (normal positioning) */}
      <div className="d-none d-lg-flex align-items-center justify-content-between mb-5 pt-4 border-bottom pb-3">
        <div>
          <h1 className="mb-1 fw-light">Dashboard</h1> {/* Reduced visual weight */}
          <p className="text-secondary mb-0">Here&apos;s a summary of your Cinema activity.</p>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-3 align-items-end align-items-sm-center">
          {/* Change btn-danger to a modern primary/secondary action button */}
          {canCreateEvent && (
           <PermissionGuard permission="Pay for Booking">
            <button className="btn btn-warning d-flex align-items-center gap-2 text-nowrap" onClick={() => router.push("/schedule/schedule-list")}>
              Buy Ticket
            </button>
             </PermissionGuard>
          )}

          <div className="position-relative">
            {/* Cleaner profile button */}
            <button
              className="btn btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center"
              onClick={() => setProfileOpen(p => !p)}
              aria-expanded={profileOpen}
              style={{ width: 40, height: 40 }}
            >
              <MdPerson size={20} />
            </button>

            {profileOpen && (
              <div 
                className="card shadow-lg position-absolute end-0 mt-2 border-0" 
                style={{ width: 280, zIndex: 1100, borderRadius: '10px' }}
                onMouseLeave={() => setProfileOpen(false)} // Optional: close on mouse leave
              >
                <div className="card-body py-3 border-bottom">
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, fontWeight: 600 }}>
                      {getInitials(authUser?.name ?? authUser?.email)}
                    </div>
                    <div>
                      <div className="fw-bold">{authUser?.name ?? "User"}</div>
                      <div className="text-muted d-flex align-items-center gap-1" style={{ fontSize: "0.8rem" }}>{authUser?.email ?? ""}</div>
                    </div>
                  </div>
                </div>
                <div className="list-group list-group-flush">
                  <button className="list-group-item list-group-item-action d-flex align-items-center gap-3 py-2" onClick={() => openUpdateProfile()}>
                    <MdPerson size={20} className="text-primary" />
                    <span className="fw-medium">Update Profile</span>
                  </button>
                  <button className="list-group-item list-group-item-action d-flex align-items-center gap-3 py-2" onClick={() => openChangePassword()}>
                    <MdLock size={20} className="text-secondary" />
                    <span className="fw-medium">Change Password</span>
                  </button>
                  <button className="list-group-item list-group-item-action d-flex align-items-center gap-3 py-2 text-danger" onClick={handleLogout}>
                    <MdLogout size={20} />
                    <span className="fw-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      
      {/* Schedule Statistics Section */}
      <div className="mb-4">
        <div className="row g-4 mb-5">
          <KpiCard status="schedule-today" isLoading={loadingScheduleStats} />
          <KpiCard status="schedule-scheduled" isLoading={loadingScheduleStats} />
          <KpiCard status="schedule-canceled" isLoading={loadingScheduleStats} />
          <KpiCard status="schedule-completed" isLoading={loadingScheduleStats} />
        </div>
      </div>

      {/* Today's bookings summary removed (see Quick Actions -> Bookings Today modal) */}

      {/* Main content row: Chart + Recent Bookings */}
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card shadow-lg h-100 border-0" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 fw-bold">Cinema Activity</h5>
                <small className="text-muted">Last 30 days</small>
              </div>
              <div style={{height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c757d', border: '1px dashed #e9ecef', borderRadius: '8px'}}>
                {loadingTodayBookings ? (
                    <div className="text-center p-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading Chart...</span>
                        </div>
                        <p className="mt-2 text-muted">Loading activity data...</p>
                    </div>
                ) : (
                    <div className="text-center p-5">
                        <svg width="120" height="120" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#f8f9fa" stroke="#e9ecef"/><path d="M10 70 L30 40 L50 50 L70 30 L90 60" stroke="#0d6efd" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                        <p className="mt-2 text-muted">Cinema Chart visualization.</p>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card shadow-lg h-100 border-0" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <h5 className="mb-4 fw-bold">Quick Actions</h5>
              <PermissionGuard permission="Manage Advertisements">
              <div className="d-grid gap-3">
                <button
                  className="btn btn-primary d-flex align-items-center gap-2 text-nowrap"
                  onClick={() => router.push('/dashboard/video-gallery')}
                >
                  Advertisements
                </button>
              </div>
              </PermissionGuard>
            </div>
          </div>
        </div>
      </div>
      
      {/* --- Change Password Modal (Visuals enhanced) --- */}
      {showChangePasswordModal && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1200 }} onClick={() => setShowChangePasswordModal(false)} />
          <div className="position-fixed top-50 start-50 translate-middle" style={{ zIndex: 1201, width: '100%', maxWidth: 480 }}>
            <div className="card shadow-xl border-0" style={{ borderRadius: '12px' }}>
              <div className="card-header d-flex justify-content-between align-items-center bg-light border-bottom">
                <h5 className="mb-0 fw-bold">Change Password</h5>
                <button className="btn-close" aria-label="Close" onClick={() => setShowChangePasswordModal(false)}></button>
              </div>
              <div className="card-body p-4">
              <div className="mb-3">
                <label className="form-label fw-medium">Current password</label>
                <div className="input-group">
                  <input type={showCurrentPassword ? "text" : "password"} className="form-control" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  <button className="btn btn-outline-secondary" type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                    {showCurrentPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-medium">New password</label>
                <div className="input-group">
                  <input type={showNewPassword ? "text" : "password"} className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <button className="btn btn-outline-secondary" type="button" onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label fw-medium">Confirm new password</label>
                <div className="input-group">
                  <input type={showConfirmPassword ? "text" : "password"} className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  <button className="btn btn-outline-secondary" type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                  </button>
                </div>
              </div>
                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-primary px-5" onClick={() => setShowChangePasswordModal(false)} disabled={changingPassword}>Cancel</button>
                  <button className="btn btn-secondary px-5btn btn-warning d-flex align-items-center gap-2 text-nowrap" onClick={handleChangePassword} disabled={changingPassword}>{changingPassword ? 'Updating...' : 'Update Password'}</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Today's Bookings modal removed; use dedicated page at /booking/today-bookings */}

      {/* Paga Modal (simple payment modal) */}
      {showPagaModal && pagaBooking && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1300 }} onClick={() => setShowPagaModal(false)} />
          <div className="position-fixed top-50 start-50 translate-middle" style={{ zIndex: 1301, width: '95%', maxWidth: 520 }}>
            <div className="card shadow-xl border-0" style={{ borderRadius: '12px' }}>
              <div className="card-header d-flex justify-content-between align-items-center bg-light border-bottom">
                <h5 className="mb-0 fw-bold">Paga Payment</h5>
                <button className="btn-close" aria-label="Close" onClick={() => setShowPagaModal(false)}></button>
              </div>
              <div className="card-body">
                <p className="mb-2"><strong>{pagaBooking.title || pagaBooking.code}</strong></p>
                <p className="text-muted mb-3">{pagaBooking.code} · {pagaBooking.date}</p>
                <div className="mb-3">
                  <label className="form-label">Amount</label>
                  <input className="form-control" value={pagaBooking.amountpaid || pagaBooking.dueamount || pagaBooking.amount || ''} readOnly />
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-secondary" onClick={() => setShowPagaModal(false)}>Cancel</button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      console.log('Initiate Paga for', pagaBooking);
                      // Demo message; simulate successful payment and redirect to scheduled list
                      toast.info('Paga flow not integrated (demo) — redirecting to scheduled upon success');
                      setShowPagaModal(false);
                      router.push('/schedule/schedule-list');
                    }}
                  >Proceed to Paga</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Update Profile Modal */}
      {showUpdateProfileModal && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1300 }} onClick={() => setShowUpdateProfileModal(false)} />
          <div className="position-fixed top-50 start-50 translate-middle" style={{ zIndex: 1301, width: '95%', maxWidth: 520 }}>
            <div className="card shadow-xl border-0" style={{ borderRadius: '12px' }}>
              <div className="card-header d-flex justify-content-between align-items-center bg-light border-bottom">
                <h5 className="mb-0 fw-bold">Update Profile</h5>
                <button className="btn-close" aria-label="Close" onClick={() => setShowUpdateProfileModal(false)} disabled={updatingProfile}></button>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Full Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    disabled={updatingProfile}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email *</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    disabled={updatingProfile}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    value={profileForm.phoneNo}
                    onChange={(e) => setProfileForm({ ...profileForm, phoneNo: e.target.value })}
                    disabled={updatingProfile}
                    placeholder="e.g. 08012345678"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Address</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    disabled={updatingProfile}
                    placeholder="Your address"
                  />
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-secondary px-4" onClick={() => setShowUpdateProfileModal(false)} disabled={updatingProfile}>Cancel</button>
                  <button className="btn btn-primary px-4" onClick={handleUpdateProfile} disabled={updatingProfile}>
                    {updatingProfile ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}