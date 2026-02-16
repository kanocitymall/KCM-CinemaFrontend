"use client";

import React, { useState, Dispatch, SetStateAction, useEffect, useMemo } from "react";
import { useForm, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { CircularProgress } from "@mui/material";
import { handleYupErrors } from "@/app/utils/yup-form-helpers";
import CustomInput from "@/app/components/form-controls/input";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";

// 1. Fixed 'any' error by defining a proper interface
export interface HallImage {
  id: number;
  url: string;
}

export interface Hall {
  id: number;
  name: string;
  code: string;
  total_seats: number;
  seat_layout: string | null;
  details: string | null;
  status: number;
  created_at: string;
  updated_at: string;
  images: HallImage[]; // Changed from any[]
}

export interface HallFormInputs {
  name: string;
  total_seats: number | string;
  seat_layout: string;
  details: string;
}

const defaultValues: HallFormInputs = {
  name: "",
  total_seats: "",
  seat_layout: "",
  details: "",
};

type HallFormProps = {
  hallId?: number | null;
  setRefetch: Dispatch<SetStateAction<boolean>>;
  onClose?: () => void;
};

const hallSchema = yup.object().shape({
  name: yup.string().required("Hall name is required"),
  total_seats: yup
    .number()
    .typeError("Total seats must be a number")
    .integer("Must be a whole number")
    .required("Total seats is required"),
  seat_layout: yup.string().ensure().default(""),
  details: yup.string().ensure().default(""),
});

const CreateHallForm: React.FC<HallFormProps> = ({
  hallId = null,
  setRefetch,
  onClose,
}) => {
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const api = useMemo(() => getApiClientInstance(), []);
  const router = useRouter();

  const methods = useForm<HallFormInputs>({
    defaultValues,
    resolver: yupResolver(hallSchema) as Resolver<HallFormInputs>,
  });

  const { reset, handleSubmit, control, setError } = methods;

  useEffect(() => {
    const fetchHallDetails = async () => {
      if (!hallId) {
        reset(defaultValues);
        return;
      }

      setFetching(true);
      try {
        const res = await api.get(`/halls/get-hall/${hallId}`);
        const hallData: Hall = res.data.data;

        reset({
          name: hallData.name,
          total_seats: hallData.total_seats,
          seat_layout: hallData.seat_layout || "",
          details: hallData.details || "",
        });
      } catch {
        // Error caught but not used
        setErrorMessage("Failed to load hall details");
      } finally {
        setFetching(false);
      }
    };

    fetchHallDetails();
  }, [hallId, api, reset]);

  const onSubmit = async (data: HallFormInputs) => {
    setLoading(true);
    setSuccessMessage(undefined);
    setErrorMessage(undefined);

    try {
      const payload = {
        name: data.name,
        total_seats: Number(data.total_seats),
        details: data.details,
        seat_layout: data.seat_layout,
      };

      if (hallId) {
        await api.put(`/halls/edit-hall/${hallId}`, payload);
        setSuccessMessage("Hall updated successfully");
      } else {
        const res = await api.post("/halls/create-hall", payload);
        setSuccessMessage("Hall created successfully");
        reset(defaultValues);
        const newId = res.data?.data?.id;
        if (newId) router.push(`/hall/hall-list/details/${newId}`);
      }

      setRefetch(true);
      if (onClose) setTimeout(() => onClose(), 2000);
    } catch (err) {
      const error = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
      const serverErrors = error.response?.data?.errors;

      if (serverErrors) {
        handleYupErrors({
          formFields: data,
          serverError: serverErrors,
          yupSetError: setError,
        });
      } else {
        setErrorMessage(error.response?.data?.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="text-center p-5">
        <CircularProgress size={30} />
        <p className="mt-2 text-muted">Loading hall data...</p>
      </div>
    );
  }

  return (
    <div className="px-3">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="d-flex flex-column gap-3 mb-4">
          <CustomInput label="Name" name="name" type="text" control={control} placeholder="Enter hall name" />
          <CustomInput label="Total-seats" name="total_seats" type="number" control={control} placeholder="Enter total seats" />
          <CustomInput label="Seat Layout" name="seat_layout" type="text" control={control} placeholder="Enter seat layout" />
          <CustomInput label="Detail" name="details" type="text" control={control} placeholder="Enter details" />
        </div>

        <button type="submit" disabled={loading} className={`btn btn-${hallId ? "primary" : "danger"} w-100 mb-3`}>
          {loading ? <CircularProgress size={20} color="inherit" /> : (hallId ? "Update Hall" : "Create Hall")}
        </button>

        {successMessage && <p className="text-success text-center fw-bold">{successMessage}</p>}
        {errorMessage && <p className="text-danger text-center small">{errorMessage}</p>}
      </form>
    </div>
  );
};

export default CreateHallForm;