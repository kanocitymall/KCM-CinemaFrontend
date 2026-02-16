"use client";

import React, { useState, Dispatch, SetStateAction, useEffect, useMemo } from "react";
import { useForm, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { CircularProgress } from "@mui/material";
import { handleYupErrors } from "@/app/utils/yup-form-helpers";
import CustomInput from "@/app/components/form-controls/input";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { AxiosError } from "axios";

// 1. Data Structures
export interface ProgramType {
  id: number;
  name: string;
  description: string;
}

export interface ProgramTypeFormInputs {
  name: string;
  description: string;
}

const defaultValues: ProgramTypeFormInputs = {
  name: "",
  description: "",
};

// 2. Component Definition
const ProgramTypeForm: React.FC<{
  serviceType?: ProgramType | null; 
  setRefetch: Dispatch<SetStateAction<boolean>>;
  onClose?: () => void;
}> = ({ serviceType = null, setRefetch, onClose }) => {
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const api = useMemo(() => getApiClientInstance(), []);

  const programTypeSchema = yup.object().shape({
    name: yup.string().required("Program name is required"),
    description: yup.string().required("Description is required"),
  });

  // 3. Form Initialization
  const { control, handleSubmit, reset, setError, trigger } = useForm<ProgramTypeFormInputs>({
    defaultValues,
    resolver: yupResolver(programTypeSchema) as Resolver<ProgramTypeFormInputs>,
  });

  useEffect(() => {
    if (serviceType) {
      reset({
        name: serviceType.name,
        description: serviceType.description,
      });
    } else {
      reset(defaultValues);
    }
  }, [serviceType, reset]);

  // 4. API Submission Logic
  const handleSubmitForm = async (data: ProgramTypeFormInputs) => {
    setShowConfirm(false);
    setLoading(true);
    setSuccessMessage(undefined);
    setErrorMessage(undefined);

    try {
      if (serviceType?.id) {
        // FIXED: Using backticks (`) and ${serviceType.id} to inject the actual ID
        await api.put(`/programs/update-programtype/${serviceType.id}`, data);
        setSuccessMessage(`Program Type updated successfully`);
      } else {
        // Create Path
        await api.post("/programs/create-programtype", data);
        setSuccessMessage("Program Type created successfully");
        reset(defaultValues);
      }

      setRefetch(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
      
    } catch (err) {
      const error = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
      const serverErrors = error.response?.data?.errors;
      
      if (serverErrors && typeof serverErrors === "object") {
        handleYupErrors({
          formFields: data,
          serverError: serverErrors,
          yupSetError: setError,
        });
      } else {
        setErrorMessage(error.response?.data?.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  // Logic to handle "Update" button click
  const handleEditClick = async () => {
    const isValid = await trigger(); 
    if (isValid) {
      setShowConfirm(true);
    }
  };

  return (
    <div className="px-1">
      <form onSubmit={handleSubmit(handleSubmitForm)}>
        {showConfirm ? (
          <div className="py-4 text-center">
            <h5 className="mb-2 fw-bold text-primary">Confirm Update</h5>
            <p className="text-muted small">Are you sure you want to save these changes?</p>
            <div className="d-flex justify-content-center gap-2 mt-4">
              <button 
                className="btn btn-primary px-4" 
                type="submit" 
                disabled={loading}
              >
                {loading ? <CircularProgress size={16} color="inherit" /> : "Yes, Update"}
              </button>
              <button
                className="btn btn-light px-4 border"
                type="button"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="py-2">
            <CustomInput
              label="Program Name *"
              name="name"
              control={control}
              type="text"
              placeholder="e.g. Football Champion League"
            />
            
            <div className="mt-3">
              <CustomInput
                label="Description *"
                name="description"
                control={control}
                type="text"
                placeholder="Enter details about this program type"
              />
            </div>

            <div className="mt-4">
              <button
                type={serviceType ? "button" : "submit"}
                className={`btn btn-${serviceType ? "primary" : "warning"} w-100 fw-bold`}
                disabled={loading}
                onClick={() => {
                  if (serviceType) handleEditClick();
                }}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : serviceType ? (
                  "Save Changes"
                ) : (
                  "Create Program Type"
                )}
              </button>
            </div>

            {successMessage && (
              <div className="alert alert-success mt-3 py-2 small text-center border-0">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="alert alert-danger mt-3 py-2 small text-center border-0">
                {errorMessage}
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default ProgramTypeForm;