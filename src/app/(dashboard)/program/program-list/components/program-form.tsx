"use client";

import React, { useState, Dispatch, SetStateAction, useEffect, useMemo, useCallback } from "react";
import { useForm, Controller, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { CircularProgress } from "@mui/material";
import { handleYupErrors } from "@/app/utils/yup-form-helpers";
import CustomInput from "@/app/components/form-controls/input";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { AxiosError } from "axios";
import { toast } from "react-toastify";

export interface ProgramFormInputs {
  program_type_id: string | number;
  title: string;
  description: string;
  duration: string;
}

export interface ProgramType {
  id: number;
  name: string;
  description?: string;
  status?: number;
}

export interface Program {
  id: number;
  program_type_id?: number;
  title: string;
  description?: string;
  duration?: string;
}

const defaultValues: ProgramFormInputs = {
  program_type_id: "",
  title: "",
  description: "",
  duration: "",
};

const ProgramForm: React.FC<{
  program?: Program | null; 
  setRefetch: Dispatch<SetStateAction<boolean>>;
  onClose?: () => void;
}> = ({ program = null, setRefetch, onClose }) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false); // Loading state for fetching single record
  const [programTypes, setProgramTypes] = useState<ProgramType[]>([]);

  const api = useMemo(() => getApiClientInstance(), []);

  const programSchema = yup.object().shape({
    program_type_id: yup
      .number()
      .typeError("Please select a program type")
      .required("Program type is required"),
    title: yup.string().required("Title is required"),
    description: yup.string().nullable(),
    duration: yup.string().nullable(),
  });

  const { control, handleSubmit, reset, setError } = useForm<ProgramFormInputs>({
    defaultValues,
    resolver: yupResolver(programSchema) as Resolver<ProgramFormInputs>,
  });

  // --- Fetch Program Types for Dropdown ---
  useEffect(() => {
    const fetchProgramTypes = async () => {
      try {
        const res = await api.get("/programs/programtypes");
        const data = res.data?.data?.data || res.data?.data || [];
        setProgramTypes(data);
      } catch (error) {
        console.error("❌ Failed to load program types", error);
      }
    };
    fetchProgramTypes();
  }, [api]);

  // --- Fetch Specific Program Details for Edit Mode ---
  const fetchProgramDetails = useCallback(async (id: number) => {
    try {
      setFetching(true);
      const res = await api.get(`/programs/show-program/${id}`);
      if (res.data?.success && res.data?.data) {
        const item = res.data.data;
        reset({
          program_type_id: item.program_type_id || "",
          title: item.title || "",
          description: item.description || "",
          duration: item.duration || "",
        });
      }
    } catch {
      toast.error("Failed to load program details");
    } finally {
      setFetching(false);
    }
  }, [api, reset]);

  useEffect(() => {
    if (program?.id) {
      fetchProgramDetails(program.id);
    } else {
      reset(defaultValues);
    }
  }, [program, fetchProgramDetails, reset]);

  const handleSubmitForm = async (data: ProgramFormInputs) => {
    setShowConfirm(false);
    setLoading(true);
    setErrorMessage(undefined);

    try {
      const payload = {
        program_type_id: Number(data.program_type_id),
        title: data.title,
        description: data.description || "",
        duration: data.duration || "",
      };

      if (program?.id) {
        await api.put(`/programs/update-program/${program.id}`, payload);
        toast.success("Program updated successfully");
      } else {
        await api.post("/programs/create-program", payload);
        toast.success("Program created successfully");
        reset(defaultValues);
      }

      setRefetch(true);
      if (onClose) onClose();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
      const serverErrors = axiosError.response?.data?.errors;
      if (serverErrors) {
        handleYupErrors({ formFields: data, serverError: serverErrors, yupSetError: setError });
      } else {
        setErrorMessage(axiosError.response?.data?.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="d-flex justify-content-center py-5">
        <CircularProgress size={30} />
      </div>
    );
  }

  return (
    /* Center and constrain to Medium size (approx 500px - 600px) */
    <div className="mx-auto" style={{ maxWidth: "550px", width: "100%" }}>
      <form onSubmit={handleSubmit(handleSubmitForm)} className="px-2">
        {showConfirm ? (
          <div className="py-4 text-center shadow-sm rounded border bg-light">
            <p className="fw-bold">Confirm Changes</p>
            <p className="small text-muted">Are you sure you want to save this program?</p>
            <div className="d-flex justify-content-center gap-3 mt-3">
              <button className="btn btn-primary px-4" type="submit" disabled={loading}>
                {loading ? <CircularProgress size={16} color="inherit" /> : "Confirm"}
              </button>
              <button className="btn btn-outline-secondary px-4" type="button" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="pb-3">
            <Controller
              name="program_type_id"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <div className="form-group mb-3">
                  <label className="form-label fw-bold small">Program Type *</label>
                  <select {...field} className={`form-select ${error ? "is-invalid" : ""}`}>
                    <option value="">-- Select Program Type --</option>
                    {programTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                  {error && <div className="invalid-feedback">{error.message}</div>}
                </div>
              )}
            />

            <CustomInput label="Title *" name="title" control={control} type="text" placeholder="e.g. Football" />
            <CustomInput label="Duration" name="duration" control={control} type="text" placeholder="e.g. 1.5 hours" />

            <div className="form-group mb-3">
               <label className="form-label fw-bold small">Description</label>
               <Controller
                 name="description"
                 control={control}
                 render={({ field }) => (
                   <textarea 
                     {...field} 
                     className="form-control" 
                     rows={3} 
                     placeholder="Details about the program..."
                   />
                 )}
               />
            </div>

            <button
              type={program ? "button" : "submit"}
              className={`btn btn-${program ? "primary" : "warning"} w-100 mt-4 fw-bold py-2`}
              onClick={() => { if (!program) return; setShowConfirm(true); }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                program ? "Update Program" : "Create Program"
              )}
            </button>

            {errorMessage && <p className="text-danger text-center small mt-3">{errorMessage}</p>}
          </div>
        )}
      </form>
    </div>
  );
};

export default ProgramForm;