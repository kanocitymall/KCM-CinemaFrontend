import type { Metadata } from "next";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import customLufga from "../../public/fonts/Lufga/custom-lufga-font";
import "react-toastify/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import ReduxProvider from "@/providers/redux-provider";
import AuthInitializer from "./components/auth-initializer";

export const metadata: Metadata = {
  title: " Kano City Mall Viewing Center",
  description: "Experience the Ultimate Shopping Destination in Kano",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${customLufga.className}`}>
        <ReduxProvider>
          <AuthInitializer>{children}</AuthInitializer>
        </ReduxProvider>
        <ToastContainer position="bottom-right" />
      </body>
    </html>
  );
}
