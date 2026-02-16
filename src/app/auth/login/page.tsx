"use client";
import Image from "next/image";
import { useState } from "react";
import { Checkbox, CircularProgress } from "@mui/material";
import { MdOutlineMail } from "react-icons/md";
import * as yup from "yup";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import FacebookRoundedIcon from "@mui/icons-material/FacebookRounded";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import EmailIcon from "@mui/icons-material/Email";
import { IoMdLock } from "react-icons/io";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";

import InputWithIcon from "../../components/form-controls/input-with-icon/input-with-icon";
import ForgotPassword from "../../components/forgotpassword/forgotpassword";
import Link from "next/link";

import { toast } from "react-toastify";
import { LoginCredentials } from "@/store/features/auth/types";
import { useDispatch } from "react-redux";
import { authActions } from "@/store/features/auth";
import { AppDispatch } from "@/store";
import { useRouter } from "next/navigation";

// ✅ FIX 1: Use a type alias instead of an empty interface to satisfy ESLint
type LoginFormValues = LoginCredentials;

// ✅ FIX 2: Move schema outside to prevent unnecessary re-renders
const loginSchema = yup.object().shape({
  email: yup.string().email("Invalid email format").required("Email address is required"),
  password: yup.string().required("Password is required"),
});

const defaultValues: LoginFormValues = {
  email: "",
  password: "",
};

const Login: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  // ✅ FIX 3: Explicitly type useForm with our type alias
  const methods = useForm<LoginFormValues>({
    defaultValues,
    mode: "onChange",
    resolver: yupResolver(loginSchema),
  });

  // ✅ FIX 4: Correct SubmitHandler typing
  const onFormSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setLoading(true);
    dispatch(authActions.main.login({ email: data.email, password: data.password }))
      .unwrap()
      .then((result) => {
        toast.success("Login successful!");
        if (result.hasDefaultPassword) {
          router.replace("/auth/update-password");
        } else {
          router.replace("/dashboard");
        }
      })
      .catch((err) => {
        console.error("Login error:", err);
        // ✅ err from rejectWithValue() is the error message string directly
        const msg = typeof err === "string" ? err : "Incorrect password or email";
        console.log("Displaying error message:", msg);
        
        if (msg.toLowerCase().includes("network")) {
          const networkMsg = "Network error: Please check your connection and try again.";
          toast.error(networkMsg);
        } else {
          toast.error(msg);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="container-fluid bg-white" style={{ height: "100vh", overflow: "hidden" }}>
      <ForgotPassword open={forgotOpen} onClose={() => setForgotOpen(false)} />

      <div className="row justify-content-center align-items-center h-100">
        <div
          className="col-12 col-md-10 col-lg-8 col-xl-6 shadow ps-0 rounded-start-5 rounded-end-5 mx-auto"
          style={{ maxWidth: "900px", width: "100%", maxHeight: "625px", overflow: "hidden" }}
        >
          <div className="row">
            <div className="col-lg-6 d-none d-lg-flex">
              <Image
                src="/images/IMG_2348.JPG"
                alt="login image"
                width={734}
                height={834}
                className="img-fluid rounded-start-5 w-100 h-100"
                style={{ objectFit: "cover" }}
                unoptimized
              />
            </div>

            <div className="col-12 col-lg-6">
              <div className="px-3 px-lg-4 py-5">
                <div className="text-center d-flex flex-column align-items-center">
                  <Image
                    src="/images/logo.png"
                    alt="Logo"
                    width={150}
                    height={45}
                    style={{ objectFit: "contain" }}
                    unoptimized
                  />
                  <h4 className="text-dark mt-1 mb-1 fw-normal d-none d-sm-block">
                    Welcome Back 👋
                  </h4>
                </div>

                <form onSubmit={methods.handleSubmit(onFormSubmit)}>
                  <div className="mb-3">
                    <label className="form-label fw-bold mb-2 text-danger">Sign in</label>

                    <InputWithIcon
                      name="email"
                      type="email"
                      LeftIcon={MdOutlineMail}
                      label="Email"
                      control={methods.control}
                    />

                    <InputWithIcon
                      name="password"
                      type="password"
                      LeftIcon={IoMdLock}
                      label="Password"
                      control={methods.control}
                    />
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center">
                        <Checkbox
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          color="error"
                          style={{ padding: "0" }}
                        />
                        <span className="ms-1" style={{ fontSize: "0.9rem", color: "#616161" }}>
                          Remember me
                        </span>
                      </div>
                      <span
                        onClick={() => setForgotOpen(true)}
                        style={{ cursor: "pointer", fontSize: "0.9rem" }}
                        className="text-black"
                      >
                        Forgot Password?
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-danger w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={20} style={{ color: "white" }} />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </button>

                  {/* Sign Up Link */}
                  <div className="text-center mt-3">
                    <p className="small text-muted">
                      Don&apos;t have an account?{" "}
                      <Link href="/auth/signup" className="text-danger fw-bold">
                        Sign up now
                      </Link>
                    </p>
                  </div>
                </form>

                <div className="customer-support-section mt-4 d-none d-lg-block text-center">
                  <p>
                    <span className="text-danger">Sign In Secured by</span> <span>AITS HUB</span>
                  </p>
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <SupportAgentIcon />
                    <p className="text-danger mb-0 fw-semibold">Customer Support</p>
                  </div>
                  <p className="form-text fw-semibold">Call/Chat with us or send an email</p>
                  
                  <div className="d-flex justify-content-center gap-3 text-danger">
                    <a href="https://www.facebook.com" className="nav-link"><FacebookRoundedIcon /></a>
                    <a href="https://www.whatsapp.com" className="nav-link"><WhatsAppIcon /></a>
                    <a href="https://www.instagram.com" className="nav-link"><InstagramIcon /></a>
                    <a href="https://www.twitter.com" className="nav-link text-black"><XIcon /></a>
                    <a href="mailto:info@kanocitymall@gmail.com" className="nav-link"><EmailIcon /></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;