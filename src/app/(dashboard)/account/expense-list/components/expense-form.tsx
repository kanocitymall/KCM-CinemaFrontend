"use client";
import { Resolver } from "react-hook-form";
import React, { useState, Dispatch, SetStateAction, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { CircularProgress } from "@mui/material";
import { handleYupErrors } from "@/app/utils/yup-form-helpers";
import CustomInput from "@/app/components/form-controls/input";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { AxiosError } from "axios";

import Select from "@/app/components/form-controls/input-with-icon/select";

interface Account {
  id: number;
  name: string;
  account_no?: string;
  status: number;
}

export interface CreateExpenseFormData {
  id?: number;
  beneficiary: string;
  amount: number;
  details: string;
  account_id?: number | string | null;
  payment_method_id?: number | string | null;
  date: string;
}

const defaultValues: CreateExpenseFormData = {
  beneficiary: "",
  amount: 0,
  details: "",
  account_id: "",
  payment_method_id: "",
  date: "",
};

type ExpenseFormProps = {
  expense?: CreateExpenseFormData | null;
  setRefetch: Dispatch<SetStateAction<boolean>>;
  onSuccess?: () => void;
};

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  expense = null,
  setRefetch,
  onSuccess,
}) => {
  const [successMessage, setSuccessMessage] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const api = useMemo(() => getApiClientInstance(), []);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoadingAccounts(true);
      const res = await api.get("/accounting/accounts");
      if (res.data.success && Array.isArray(res.data.data)) {
        setAccounts(res.data.data);
      } else {
        setAccounts([]);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  }, [api]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const expenseSchema = yup.object().shape({
    beneficiary: yup.string().required("Beneficiary is required"),
    amount: yup
      .number()
      .typeError("Amount must be a number")
      .required("Amount is required"),
    details: yup.string().required("Details are required"),
    account_id: yup.mixed().nullable(),
    payment_method_id: yup.mixed().nullable(),
    date: yup.string().required("Date is required"),
  });

  const methods = useForm<CreateExpenseFormData>({
    defaultValues,
    resolver: yupResolver(expenseSchema) as Resolver<CreateExpenseFormData>,
  });

  useEffect(() => {
    if (expense) {
      methods.reset({
        beneficiary: expense.beneficiary,
        amount: expense.amount,
        details: expense.details,
        account_id: expense.account_id ?? "",
        payment_method_id: expense.payment_method_id ?? "",
        date: expense.date,
      });
    } else {
      methods.reset(defaultValues);
    }
  }, [expense, methods]);

  const handleSubmit = async (data: CreateExpenseFormData) => {
    setLoading(true);
    setSuccessMessage(undefined);
    setErrorMessage(undefined);

    const transformedData = {
      ...data,
      account_id: data.account_id === "" ? null : Number(data.account_id),
      payment_method_id: data.payment_method_id === "" ? null : Number(data.payment_method_id),
    };

    try {
      if (expense && expense.id) {
        await api.put(`/accounting/update-expense/${expense.id}`, transformedData);
        setSuccessMessage("Expense updated successfully");
      } else {
        await api.post("/accounting/create-expense", transformedData);
        setSuccessMessage("Expense created successfully");
        methods.reset(defaultValues);
      }

      setRefetch(true);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      // FIXED: Used unknown + AxiosError cast to remove 'any'
      const error = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
      console.error(error);

      const serverErrors = error.response?.data?.errors;
      if (serverErrors && typeof serverErrors === "object") {
        handleYupErrors({
          formFields: transformedData,
          serverError: serverErrors,
          yupSetError: methods.setError,
        });
      } else {
        setErrorMessage(error.response?.data?.message || error.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-3">
      <form onSubmit={methods.handleSubmit(handleSubmit)}>
        <CustomInput
          label="Beneficiary"
          name="beneficiary"
          type="text"
          control={methods.control}
          placeholder="Enter Beneficiary Name"
        />

        <CustomInput
          label="Amount"
          name="amount"
          control={methods.control}
          type="number"
        />

        <CustomInput
          label="Description"
          name="details"
          type="text"
          control={methods.control}
          placeholder="Enter Expense Details"
        />

        <Select
          label="Payment Method"
          name="payment_method_id"
          control={methods.control}
        >
          <option value="">Select Payment Method</option>
          <option value="1">Cash</option>
          <option value="2">Bank Transfer</option>
          <option value="3">Cheque</option>
        </Select>

        <div className="mb-3">
          <label className="form-label">Account (optional)</label>
          <select
            {...methods.register("account_id")}
            className="form-control"
          >
            <option value="">Select an account (optional)</option>
            {loadingAccounts ? (
              <option disabled>Loading accounts...</option>
            ) : (
              accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} {account.account_no ? `(${account.account_no})` : ""}
                </option>
              ))
            )}
          </select>
          {methods.formState.errors.account_id && (
            <div className="text-danger mt-1">
              {methods.formState.errors.account_id.message}
            </div>
          )}
        </div>

        <CustomInput
          label="Date"
          name="date"
          control={methods.control}
          type="date"
        />

        <button
          type="submit"
          disabled={loading}
          className={`btn btn-${expense ? "primary" : "danger"} w-100 mt-4`}
        >
          {loading ? (
            <CircularProgress className="text-white" size={14} />
          ) : expense ? (
            "Update Expense"
          ) : (
            "Create Expense"
          )}
        </button>

        {successMessage && <p className="text-success text-center mt-2">{successMessage}</p>}
        {errorMessage && <p className="text-danger text-center mt-2">{errorMessage}</p>}
      </form>
    </div>
  );
};

export default ExpenseForm;