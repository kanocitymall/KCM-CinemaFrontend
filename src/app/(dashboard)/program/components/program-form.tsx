"use client";

import React, { useState, Dispatch, SetStateAction, useEffect, useMemo } from "react";
import { useForm, Controller, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { CircularProgress } from "@mui/material";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import { handleYupErrors } from "../../../utils/yup-form-helpers";
import CustomInput from "../../../components/form-controls/input";
import { getApiClientInstance } from "../../../utils/axios/axios-client";

interface ProgramType {
  id: number;
  name: string;
  description?: string;
  status?: number;
}

interface Program {
  id?: number;
  program_type_id: number;
  title: string;
  description?: string;
  duration?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProgramFormData {
  program_type_id: number | string;
  title: string;
  description: string;
  duration: string;
}

interface ApiErrorResponse {
  errors?: Record<string, string[]>;
  message?: string;
}

const ProgramForm: React.FC<{
  program?: Program | null; 
  setRefetch: Dispatch<SetStateAction<boolean>>;
  onClose?: () => void;
}> = ({ program = null, setRefetch, onClose }) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const { control, handleSubmit, reset, setError } = useForm<ProgramFormData>({
    defaultValues: {
        program_type_id: "",
        title: "",
        description: "",
        duration: "",
    },
    resolver: yupResolver(programSchema) as Resolver<ProgramFormData>,
  });

  useEffect(() => {
    const fetchProgramTypes = async () => {
      try {
        const res = await api.get<{ data: { data: ProgramType[] } | ProgramType[] }>("/programs/programtypes");
        const data = Array.isArray(res.data?.data) ? res.data.data : (res.data?.data?.data || []);
        setProgramTypes(data);
      } catch {
        console.error("❌ Failed to load program types");
      }
    };
    fetchProgramTypes();
  }, [api]);

  useEffect(() => {
    if (program) {
      reset({
        program_type_id: program.program_type_id || "",
        title: program.title || "",
        description: program.description || "",
        duration: program.duration || "",
      });
    }
  }, [program, reset]);

  const handleSubmitForm = async (data: ProgramFormData) => {
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
        reset();
      }

      setRefetch(true);
      if (onClose) onClose();
    } catch (err: unknown) {
      const error = err as AxiosError<ApiErrorResponse>;
      const serverErrors = error.response?.data?.errors;
      
      if (serverErrors) {
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

  return (
    <div className="px-2">
      <form onSubmit={handleSubmit(handleSubmitForm)}>
        {showConfirm ? (
          <div className="py-4 text-center">
            <p>Save changes to this program?</p>
            <div className="d-flex justify-content-center gap-3">
              <button className="btn btn-primary px-4" type="submit" disabled={loading}>Yes</button>
              <button className="btn btn-secondary px-4" type="button" onClick={() => setShowConfirm(false)}>No</button>
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
                  {error && <div className="invalid-feedback text-danger small">{error.message}</div>}
                </div>
              )}
            />

            <CustomInput label="Title *" name="title" control={control} type="text" placeholder="e.g. Football" />
            <CustomInput label="Duration" name="duration" control={control} type="text" placeholder="e.g. 1 hour" />

            <div className="form-group mb-3">
               <label className="form-label fw-bold small">Description</label>
               <Controller
                 name="description"
                 control={control}
                 render={({ field }) => (
                   <textarea {...field} className="form-control" rows={3} />
                 )}
               />
            </div>

            <button
              type={program ? "button" : "submit"}
              className={`btn btn-${program ? "primary" : "warning"} w-100 mt-4 fw-bold`}
              onClick={() => { if (!program) return; setShowConfirm(true); }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={18} color="inherit" /> : program ? "Update" : "Create"}
            </button>
            {errorMessage && <p className="text-danger text-center small mt-2">{errorMessage}</p>}
          </div>
        )}
      </form>
    </div>
  );
};

export default ProgramForm;