"use client";

import React, { useState, Dispatch, SetStateAction, useEffect, useMemo } from "react";
import { useForm, Controller, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { CircularProgress } from "@mui/material";
import { handleYupErrors } from "@/app/utils/yup-form-helpers";
import CustomInput from "@/app/components/form-controls/input";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { AxiosError } from "axios";

// --- Interfaces ---

interface Permission {
  id: number;
  name: string;
}

export interface UserData {
  id: number;
  name: string;
  phoneNo: string;
  email: string;
  address: string;
  permissions: (number | Permission)[];
}

export interface UserFormInputs {
  name: string;
  phoneNo: string;
  email: string;
  password?: string;
  address: string;
  permissions: number[];
}

const defaultValues: UserFormInputs = {
  name: "",
  phoneNo: "",
  email: "",
  password: "",
  address: "",
  permissions: [],
};

const UserForm: React.FC<{
  user?: UserData | null;
  setRefetch: Dispatch<SetStateAction<boolean>>;
  onClose?: () => void;
  onSuccess?: () => void;
}> = ({ user = null, setRefetch, onClose, onSuccess }) => {
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);

  const [permError, setPermError] = useState<string | null>(null);

  // Use useMemo so the api instance is stable across renders
  const api = useMemo(() => getApiClientInstance(), []);

  const userSchema = yup.object().shape({
    name: yup.string().required("Name is required"),
    phoneNo: yup.string().required("Phone Number is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    address: yup.string().required("Address is required"),
    password: yup.string().notRequired(),
    permissions: yup
      .array()
      .of(yup.number().required())
      .min(1, "At least one permission is required")
      .required(),
  });

  const { control, handleSubmit, reset, setError } = useForm<UserFormInputs>({
    defaultValues,
    resolver: yupResolver(userSchema) as Resolver<UserFormInputs>,
  });

  // ✅ Fetch permissions
  useEffect(() => {
    const cachedPerms = localStorage.getItem("permissions");
    if (cachedPerms) {
      setPermissions(JSON.parse(cachedPerms));
      return;
    }

    const getPermissions = async () => {
      try {
        setLoadingPerms(true);
        setPermError(null);
        const res = await api.get("/permissions/get-permissions");
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : res?.data?.data?.permissions || [];

        setPermissions(list);
        localStorage.setItem("permissions", JSON.stringify(list));
      } catch (err) {
        console.error("❌ Failed to load permissions:", err);
        setPermError("Failed to load permissions.");
      } finally {
        setLoadingPerms(false);
      }
    };
    getPermissions();
  }, [api]);

  // ✅ Reset form values when editing or creating
  useEffect(() => {
    if (user) {
      const permissionsArray = Array.isArray(user.permissions)
        ? user.permissions
            .map((p) => {
              if (typeof p === "number") return p;
              if (p && typeof p === "object" && "id" in p) return p.id;
              return null;
            })
            .filter((id): id is number => id !== null)
        : [];

      reset({
        name: user.name,
        phoneNo: user.phoneNo,
        email: user.email,
        address: user.address,
        permissions: permissionsArray,
      });
    } else {
      const allPermissionIds = permissions.map((p) => p.id);
      reset({
        ...defaultValues,
        permissions: allPermissionIds,
      });
    }
  }, [user, permissions, reset]);

  // ✅ Handle form submit
  const onSubmit = async (data: UserFormInputs) => {
    setShowConfirm(false);
    setLoading(true);
    setSuccessMessage(undefined);
    setErrorMessage(undefined);

    try {
      // 🚀 Explicitly structured payload to match API spec /users/update-user/{id}
      const payload = {
        name: data.name,
        phoneNo: data.phoneNo,
        email: data.email,
        address: data.address,
        permissions: data.permissions,
        ...(data.password ? { password: data.password } : {}),
      };

      if (user) {
        await api.put(`/users/update-user/${user.id}`, payload);
        setSuccessMessage(`User "${user.name}" updated successfully`);
        if (onSuccess) onSuccess();
      } else {
        await api.post("/users/create-user", payload);
        setSuccessMessage("User created successfully");
        reset(defaultValues);
      }

      setRefetch(true);
      if (onClose) onClose();
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

  return (
    <div className="px-3">
      {loadingPerms ? (
        <div className="text-center py-5">
          <CircularProgress size={32} /> Loading form...
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          {showConfirm ? (
            <div className="pt-1 pb-3 text-center">
              <p>Are you sure you want to update this account?</p>
              <div className="d-flex justify-content-center gap-3">
                <button className="btn btn-primary px-5" type="submit">Yes</button>
                <button className="btn btn-secondary px-5" type="button" onClick={() => setShowConfirm(false)}>No</button>
              </div>
            </div>
          ) : (
            <div className="pb-5 mb-5">
              {user && <h6 className="mb-3 text-muted">Editing: <strong>{user.name}</strong></h6>}
              
              <CustomInput label="Name" name="name" control={control} type="text" placeholder="Enter full name" />
              <CustomInput label="Phone Number" name="phoneNo" control={control} type="text" placeholder="Enter phone number" />
              <CustomInput label="Email" name="email" control={control} type="email" placeholder="Enter email" />

              {user && (
                <CustomInput label="Password" name="password" control={control} type="password" placeholder="Enter new password (optional)" />
              )}

              <CustomInput label="Address" name="address" control={control} type="text" placeholder="Enter address" />

            <div className="form-group mt-3">
              <label className="form-label">Permissions</label>
              <Controller
                name="permissions"
                control={control}
                render={({ field }) => (
                  <div className="border rounded p-2" style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {loadingPerms ? (
                      <span>⏳ Loading permissions...</span>
                    ) : permError ? (
                      <span className="text-danger">{permError}</span>
                    ) : (
                      permissions.map((perm) => (
                        <div key={perm.id} className="form-check d-flex align-items-center mb-2">
                          <input
                            type="checkbox"
                            id={`perm-${perm.id}`}
                            checked={field.value?.includes(perm.id)}
                            className="form-check-input"
                            onChange={(e) => {
                              const value = field.value || [];
                              field.onChange(
                                e.target.checked
                                  ? [...value, perm.id]
                                  : value.filter((id) => id !== perm.id)
                              );
                            }}
                          />
                          <label htmlFor={`perm-${perm.id}`} className="form-check-label ms-2">
                            {perm.name}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                )}
              />
            </div>

            <button
              type={user ? "button" : "submit"}
              className={`btn btn-${user ? "primary" : "danger"} w-100 mt-5 mb-4`}
              onClick={() => {
                if (!user) return;
                setShowConfirm(true);
              }}
            >
              {loading ? <CircularProgress className="text-white" size={14} /> : user ? "Update" : "Create User"}
            </button>

            {successMessage && <p className="text-success text-center">{successMessage}</p>}
            {errorMessage && <p className="text-danger text-center">{errorMessage}</p>}
          </div>
        )}
        </form>
      )}
    </div>
  );
};

export default UserForm;