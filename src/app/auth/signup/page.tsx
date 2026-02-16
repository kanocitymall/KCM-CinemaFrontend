"use client";
import Image from "next/image";
import { useState, useMemo } from "react";
import { CircularProgress } from "@mui/material";
import { MdOutlineMail, MdPerson, MdPhone, MdLocationOn } from "react-icons/md";
import * as yup from "yup";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import FacebookRoundedIcon from "@mui/icons-material/FacebookRounded";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import EmailIcon from "@mui/icons-material/Email";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";

import InputWithIcon from "../../components/form-controls/input-with-icon/input-with-icon";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import Link from "next/link";

// ✅ Type definitions
interface SignUpFormValues {
  name: string;
  phoneno: string;
  email: string;
  address: string;
}

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
      data?: string[] | Record<string, string[]>;
    };
  };
  message?: string;
}

// ✅ Validation schema
const signUpSchema = yup.object().shape({
  name: yup
    .string()
    .required("Full name is required")
    .min(2, "Name must be at least 2 characters"),
  phoneno: yup
    .string()
    .required("Phone number is required")
    .matches(/^[0-9+\-\s()]+$/, "Invalid phone number format"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email address is required"),
  address: yup
    .string()
    .required("Address is required")
    .min(5, "Address must be at least 5 characters"),
});

const defaultValues: SignUpFormValues = {
  name: "",
  phoneno: "",
  email: "",
  address: "",
};

const SignUp: React.FC = () => {
  const router = useRouter();
  const api = useMemo(() => getApiClientInstance(), []);
  const [loading, setLoading] = useState<boolean>(false);

  // ✅ Form initialization
  const methods = useForm<SignUpFormValues>({
    defaultValues,
    mode: "onChange",
    resolver: yupResolver(signUpSchema),
  });



  // ✅ Form submission
  const onFormSubmit: SubmitHandler<SignUpFormValues> = async (data) => {
    setLoading(true);

    try {
      const payload = {
        name: data.name,
        phoneno: data.phoneno,
        email: data.email,
        address: data.address,
      };

      const response = await api.post("/customers/create-customer", payload);

      if (response?.data?.success || response?.status === 201 || response?.status === 200) {
        toast.success("Account created successfully");
        setTimeout(() => router.push("/dashboard"), 1200);
      } else {
        toast.error("Failed to create account");
      }
    } catch (err: unknown) {
      const error = err as ApiError;

      // Handle email already taken error
      if (error?.response?.data?.data && Array.isArray(error.response.data.data)) {
        const errorArray = error.response.data.data;
        errorArray.forEach((msg: string) => {
          if (msg.toLowerCase().includes("email") && msg.toLowerCase().includes("taken")) {
            methods.setError("email", {
              message: msg,
            });
            toast.error(msg);
          }
        });
      } else {
        // Show generic error message instead of backend message
        toast.error("Failed to create account. Please try again.");
      }

      // Handle field-specific errors
      if (error?.response?.data?.errors && typeof error.response.data.errors === "object") {
        const fieldErrors = error.response.data.errors;
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            methods.setError(field as keyof SignUpFormValues, {
              message: messages[0],
            });
          }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid bg-white d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div
        className="col-12 col-sm-11 col-md-10 col-lg-8 col-xl-6 shadow ps-0 rounded-start-5 rounded-end-5"
        style={{ maxWidth: "500px", width: "100%" }}
      >
        <div className="px-2 px-sm-3 px-lg-4 py-4 py-sm-5">
          <div className="text-center d-flex flex-column align-items-center mb-2 mb-sm-3">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={120}
              height={36}
              className="img-fluid"
              style={{ objectFit: "contain", maxWidth: "100%" }}
              unoptimized
            />
            <h4 className="text-dark mt-1 mb-0 fw-normal d-none d-xs-block" style={{ fontSize: "1.1rem" }}>
              Create Your Account
            </h4>
            <p className="text-muted small mt-1">Join us to start booking</p>
          </div>

          <form onSubmit={methods.handleSubmit(onFormSubmit)}>
            <div className="mb-2 mb-sm-3">
              <label className="form-label fw-bold mb-2 text-danger" style={{ fontSize: "0.95rem" }}>Sign up</label>

              {/* Full Name */}
              <InputWithIcon
                name="name"
                type="text"
                LeftIcon={MdPerson}
                label="Full Name"
                control={methods.control}
              />

              {/* Phone Number */}
              <InputWithIcon
                name="phoneno"
                type="tel"
                LeftIcon={MdPhone}
                label="Phone Number"
                control={methods.control}
              />

              {/* Email */}
              <InputWithIcon
                name="email"
                type="email"
                LeftIcon={MdOutlineMail}
                label="Email Address"
                control={methods.control}
              />

              {/* Address */}
              <InputWithIcon
                name="address"
                type="text"
                LeftIcon={MdLocationOn}
                label="Address"
                control={methods.control}
              />
            </div>

            {/* Terms and Conditions */}
            {/* Removed per user request */}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-danger w-100 py-2 py-sm-2 d-flex align-items-center justify-content-center gap-2"
              style={{ fontSize: "0.95rem" }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} style={{ color: "white" }} />
                  <span>Creating account...</span>
                </>
              ) : (
                "Create Account"
              )}
            </button>

            {/* Sign In Link */}
            <div className="text-center mt-2 mt-sm-3">
              <p className="small text-muted">
                Already have an account?
                <Link href="/auth/login" className="text-danger fw-bold ms-1">
                  Sign in
                </Link>
              </p>
            </div>
          </form>

          {/* Customer Support Section */}
          <div className="customer-support-section mt-4 d-none d-lg-block text-center">
            <p>
              <span className="text-danger">Sign Up Secured by</span> <span>AITS HUB</span>
            </p>
            <div className="d-flex justify-content-center align-items-center gap-2">
              <SupportAgentIcon />
              <p className="text-danger mb-0 fw-semibold">Customer Support</p>
            </div>
            <p className="form-text fw-semibold">Call/Chat with us or send an email</p>

            <div className="d-flex justify-content-center gap-3 text-danger">
              <a href="https://www.facebook.com" className="nav-link">
                <FacebookRoundedIcon />
              </a>
              <a href="https://www.whatsapp.com" className="nav-link">
                <WhatsAppIcon />
              </a>
              <a href="https://www.instagram.com" className="nav-link">
                <InstagramIcon />
              </a>
              <a href="https://www.twitter.com" className="nav-link text-black">
                <XIcon />
              </a>
              <a href="mailto:info@kanocitymall@gmail.com" className="nav-link">
                <EmailIcon />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
