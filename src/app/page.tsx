// "use client";
// import { useEffect } from "react";
// import { CircularProgress } from "@mui/material";
// import { useRouter } from "next/navigation";

// export default function Home() {
//   const router = useRouter();
//   useEffect(() => {
//     router.replace("/dashboard");
//   }, [router]);
//   return (
//     <div className="min-vh-100 d-flex mw-100 align-items-center justify-content-center gap-3">
    
//      <CircularProgress className="text-danger" />
//     </div>
//   );
// }

"use client";
import { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isRedirecting,] = useState(true);

  useEffect(() => {
    // Add a small delay to ensure proper routing
    const timer = setTimeout(() => {
      router.replace("/dashboard");
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  if (!isRedirecting) {
    return null;
  }

  return (
    <div className="min-vh-100 d-flex mw-100 align-items-center justify-content-center gap-3">
      <CircularProgress className="text-danger" />
      <span>Redirecting to dashboard...</span>
    </div>
  );
}