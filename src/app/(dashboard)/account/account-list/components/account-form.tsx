"use client";
import React, { Dispatch, SetStateAction, ChangeEvent, useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { CircularProgress } from "@mui/material";
import { handleYupErrors } from "@/app/utils/yup-form-helpers";
import CustomInput from "@/app/components/form-controls/input";
import Select from "@/app/components/form-controls/input-with-icon/select";
import { CreateAccountFormData } from "../types";
import { toast } from "react-toastify";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { AxiosError } from "axios";

// 1. Defined Interfaces for strict typing
interface PaymentMethod {
  id: number;
  name: string;
}

interface AccountFormInputs {
  name: string;
  number: string;
  description: string;
  payment_method_id: number;
}

const defaultValues: AccountFormInputs = {
  name: "",
  number: "",
  description: "",
  payment_method_id: 0,
};

const AccountForm: React.FC<{
  account?: CreateAccountFormData | null;
  setRefetch: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
}> = ({ account = null, setRefetch, onClose }) => {
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  
  // 2. Fixed: Replaced any[] with PaymentMethod[]
  const [paymentMethodTypes, setPaymentMethodTypes] = useState<PaymentMethod[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const api = useMemo(() => getApiClientInstance(), []);

  const accountSchema = yup.object().shape({
    name: yup.string().required("Account Name is required"),
    description: yup.string().required("Account description is required"),
    payment_method_id: yup.number().min(1, "Please select a payment method").required("Payment method is required"),
    number: yup.string().ensure(),
  });

  const methods = useForm<AccountFormInputs>({
  defaultValues,
  // Cast it to the Resolver type mapped to your interface instead of 'any'
  resolver: yupResolver(accountSchema) as Resolver<AccountFormInputs>,
});

  useEffect(() => {
  const fetchAllPaymentMethods = async () => {
    try {
      const response = await api.get("/accounting/get-all-payment-methods");
      if (response.data.success) {
        setPaymentMethodTypes(response.data.data);
      }
    } catch (err) {
      // Use AxiosError to avoid 'any'
      const error = err as AxiosError;
      console.error("Error fetching payment methods", error.message);
      toast.error("Could not load payment methods");
    }
  };

  fetchAllPaymentMethods();
}, [api]);;

  useEffect(() => {
    if (account) {
      methods.reset({
        name: account.name,
        number: account.number || "",
        description: account.description,
        payment_method_id: account.payment_method_id,
      });
    } else {
      methods.reset(defaultValues);
    }
  }, [account, methods]);

  const handlePaymentMethodChange = (e: ChangeEvent<HTMLSelectElement>) => {
    // Convert string value from HTML select to number
    const value = parseInt(e.target.value) || 0;
    methods.setValue("payment_method_id", value, { shouldValidate: true });
  };

  // 5. Fixed: Replaced (data: any) with (data: AccountFormInputs)
  const onSubmit = async (data: AccountFormInputs) => {
    setShowConfirm(false);
    setLoading(true);
    setSuccessMessage(undefined);
    setErrorMessage(undefined);
    
    try {
      if (account) {
        await api.put(`/accounting/update-account/${account.id}`, data);
        setSuccessMessage("Account updated successfully");
      } else {
        await api.post("/accounting/create-account", data);
        setSuccessMessage("Account created successfully");
        methods.reset(defaultValues);
      }
      setRefetch(true);
      setTimeout(() => onClose(), 2000); 
    } catch (err) {
      // 6. Fixed: Typed catch block to handle server-side validation errors
      const error = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
      const serverErrors = error.response?.data?.errors;
      
      if (serverErrors && typeof serverErrors === "object") {
        handleYupErrors({
          formFields: data,
          serverError: serverErrors,
          yupSetError: methods.setError,
        });
      } else {
        setErrorMessage(error.response?.data?.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-3">
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {showConfirm ? (
          <div className="pt-1 pb-3 text-center">
            <p className="fw-bold">Are you sure you want to update this account?</p>
            <div className="d-flex justify-content-center gap-3">
              <button className="btn btn-primary px-5" type="submit" disabled={loading}>
                {loading ? <CircularProgress size={14} color="inherit" /> : "Yes"}
              </button>
              <button className="btn btn-secondary px-5" type="button" onClick={() => setShowConfirm(false)}>
                No
              </button>
            </div>
          </div>
        ) : (
          <div className="pb-5 mb-5">
  <CustomInput
    label="Name"
    name="name"
    control={methods.control} // ❌ Removed "as any"
    type="text"
    placeholder="Account Name"
  />
  <CustomInput
    label="Account Number"
    name="number"
    control={methods.control} // ❌ Removed "as any"
    type="text"
    placeholder="Account Number"
  />
  <CustomInput
    label="Account description"
    name="description"
    control={methods.control} // ❌ Removed "as any"
    type="text"
    placeholder="Account description"
  />
  <Select
    label="Payment Method Type"
    name="payment_method_id"
    control={methods.control} // ❌ Removed "as any"
    onChange={handlePaymentMethodChange}
  >
              <option value="">Select Payment Method</option>
              {paymentMethodTypes.map((methodType) => (
                <option key={methodType.id} value={methodType.id}>
                  {methodType.name}
                </option>
              ))}
            </Select>

            <button
              type={account ? "button" : "submit"}
              className={`btn btn-${account ? "primary" : "danger"} w-100 mt-5 mb-4`}
              onClick={(e) => {
                if (account && !showConfirm) {
                    e.preventDefault();
                    setShowConfirm(true);
                }
              }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress color="inherit" size={14} />
              ) : account ? "Update" : "Create Account"}
            </button>

            {successMessage && <p className="text-success text-center fw-bold">{successMessage}</p>}
            {errorMessage && <p className="text-danger text-center fw-bold">{errorMessage}</p>}
          </div>
        )}
      </form>
    </div>
  );
};

export default AccountForm;