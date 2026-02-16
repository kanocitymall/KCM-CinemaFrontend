"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { authActions } from "@/store/features/auth";

/**
 * AuthInitializer component initializes the auth state on app load
 * It checks if a valid token exists in cookies and restores the user session
 */
export default function AuthInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Initialize auth state from stored token
    const initAuth = async () => {
      console.log("Initializing auth...");
      dispatch(authActions.main.initializeUser()).catch((err) => {
        console.log("Auth initialization error:", err);
      });
    };

    initAuth();
  }, [dispatch]);

  return <>{children}</>;
}
