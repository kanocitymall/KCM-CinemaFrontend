"use client";

// Removed unused authActions import
import { useEffect } from "react";
import showSingleToast from "@/app/utils/single-toast";
import { RootState } from "@/store"; // Removed AppDispatch if not used
import { useSelector } from "react-redux"; // Removed useDispatch if not used

import { CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";

import SideBar from "./components/layouts/navigation/sidebar";

// Removed unused: const isInitial = true;

const ModulesLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const auth = useSelector((state: RootState) => state.auth.main);
  
  /** * Note: If you plan to re-enable user initialization, 
   * uncomment 'dispatch' and 'authActions' import above.
   */
  // const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    console.log(
      "Layout check - isAuthenticated:", 
      auth.isAuthenticated, 
      "hasDefaultPassword:", 
      auth.hasDefaultPassword, 
      "loading:", 
      auth.loading
    );

    if (!auth.loading) {
      if (!auth.isAuthenticated) {
        router.replace("/auth/login");
      } else if (auth.hasDefaultPassword) {
        router.replace("/auth/update-password");
      }
    }
  }, [auth.isAuthenticated, auth.hasDefaultPassword, auth.loading, router]);

  // Global offline/online notifier: shows a single toast when network changes
  useEffect(() => {
    const handleOffline = () => {
      showSingleToast("You are offline. Some features may not load.", "network");
    };
    const handleOnline = () => {
      // Clear previous network toast and show a short online notice
      showSingleToast("Back online.", "network");
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // If the app boots while offline, show the toast once
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <>
      {auth.loading ? (
        <div className="min-vh-100 d-flex mw-100 align-items-center justify-content-center gap-3">
          <CircularProgress className="text-danger" />
        </div>
      ) : (
        <div className="d-block d-lg-flex min-vh-100 mw-100">
          <SideBar />
          <div className="flex-grow-1 d-flex flex-column min-vh-100 content-with-sidebar">
            <div className="flex-grow-1 mt-1 p-0">{children}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModulesLayout;