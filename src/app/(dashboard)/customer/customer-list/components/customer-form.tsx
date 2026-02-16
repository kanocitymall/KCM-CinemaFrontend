"use client";

import React, { Dispatch, SetStateAction, useEffect, useState, useMemo } from "react";
import { useForm, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { CircularProgress } from "@mui/material";
import { handleYupErrors } from "@/app/utils/yup-form-helpers";
import CustomInput from "@/app/components/form-controls/input";
import { toast } from "react-toastify";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { AxiosError } from "axios";

// --- Interfaces ---

interface CustomerFormInputs {
  name: string;
  phoneno: string;
  email: string;
  address: string;
}

interface Customer extends CustomerFormInputs {
  id: number;
  code: string;
  status: number;
}

interface ApiErrorResponse {
  message?: string;
  errors?: Record<keyof CustomerFormInputs, string[]>;
}

const defaultValues: CustomerFormInputs = {
  name: "",
  phoneno: "",
  email: "",
  address: "",
};

interface CustomerFormProps {
  customer?: Customer | null;
  setRefetch: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer = null, setRefetch, onClose }) => {
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const api = useMemo(() => getApiClientInstance(), []);

  const customerSchema = yup.object().shape({
    name: yup.string().required("Full name is required"),
    phoneno: yup.string().required("Phone number is required"),
    email: yup.string().email("Invalid email address").required("Email is required"),
    address: yup.string().required("Address is required"),
  });

  const methods = useForm<CustomerFormInputs>({
    defaultValues,
    resolver: yupResolver(customerSchema) as Resolver<CustomerFormInputs>,
  });

  useEffect(() => {
    if (customer) {
      methods.reset({
        name: customer.name,
        phoneno: customer.phoneno,
        email: customer.email,
        address: customer.address,
      });
    } else {
      methods.reset(defaultValues);
    }
  }, [customer, methods]);

  const onSubmit = async (data: CustomerFormInputs) => {
    setShowConfirm(false);
    setLoading(true);
    setSuccessMessage(undefined);
    setErrorMessage(undefined);

    try {
      if (customer) {
        /**
         * CORRECTION: 
         * 1. Removed the literal "/{id}/" string.
         * 2. Used backticks (``) and ${customer.id} to inject the actual ID.
         */
        await api.put(`/customers/edit-customer/${customer.id}`, data);
        setSuccessMessage("Customer updated successfully");
      } else {
        await api.post("/customers/create-customer", data);
        setSuccessMessage("Customer created successfully");
        methods.reset(defaultValues);
      }

      setRefetch(true);
      toast.success(customer ? "Updated!" : "Created!");
      
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      const serverErrors = error.response?.data?.errors;

      if (serverErrors) {
        handleYupErrors({
          formFields: data,
          serverError: serverErrors,
          yupSetError: methods.setError,
        });
      } else {
        const msg = error.response?.data?.message || "An error occurred";
        setErrorMessage(msg);
        toast.error(msg);
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
            <p className="fw-bold">Are you sure you want to update this customer?</p>
            <div className="d-flex justify-content-center gap-3">
              <button className="btn btn-primary px-5" type="submit" disabled={loading}>
                {loading ? <CircularProgress size={14} color="inherit" /> : "Yes, Update"}
              </button>
              <button 
                className="btn btn-secondary px-5" 
                type="button" 
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="pb-3">
            <div className="row">
              <div className="col-12">
                <CustomInput
                  label="Full Name"
                  name="name"
                  control={methods.control}
                  type="text"
                  placeholder="Enter full name"
                />
              </div>
              <div className="col-md-6">
                <CustomInput
                  label="Phone Number"
                  name="phoneno"
                  control={methods.control}
                  type="text"
                  placeholder="e.g. 08030000000"
                />
              </div>
              <div className="col-md-6">
                <CustomInput
                  label="Email Address"
                  name="email"
                  control={methods.control}
                  type="email"
                  placeholder="example@mail.com"
                />
              </div>
              <div className="col-12">
                <CustomInput
                  label="Address"
                  name="address"
                  control={methods.control}
                  type="text"
                  placeholder="Enter residential address"
                />
              </div>
            </div>

            <button
              type={customer ? "button" : "submit"}
              className={`btn btn-${customer ? "primary" : "warning"} w-100 mt-4 fw-bold`}
              onClick={(e) => {
                if (customer && !showConfirm) {
                  e.preventDefault();
                  methods.trigger().then((isValid) => {
                    if (isValid) setShowConfirm(true);
                  });
                }
              }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress color="inherit" size={14} />
              ) : customer ? (
                "Update Customer"
              ) : (
                "Submit"
              )}
            </button>

            {successMessage && <p className="text-success text-center mt-3 small fw-bold">{successMessage}</p>}
            {errorMessage && <p className="text-danger text-center mt-3 small fw-bold">{errorMessage}</p>}
          </div>
        )}
      </form>
    </div>
  );
};

export default CustomerForm;