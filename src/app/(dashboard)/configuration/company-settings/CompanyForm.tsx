"use client";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "react-bootstrap";
import { Company } from "./types";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { toast } from "react-toastify";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  motto: yup.string().required("Motto is required"),
  farewell_message: yup.string().required("Farewell message is required"),
  contact_number: yup.string().required("Contact number is required"),
  contact_email: yup.string().email("Invalid email").required("Contact email is required"),
  address: yup.string().required("Address is required"),
  bank_name: yup.string().required("Bank name is required"),
  bank_account_name: yup.string().required("Bank account name is required"),
  bank_account_number: yup.string().required("Bank account number is required"),
  bank_sort_code: yup.string().required("Bank sort code is required"),
  support_hours: yup.string().required("Support hours is required"),
  support_phone: yup.string().required("Support phone is required"),
  facebook_url: yup.string().url("Invalid URL").required("Facebook URL is required"),
  instagram_url: yup.string().url("Invalid URL").required("Instagram URL is required"),
  other_url: yup.string().url("Invalid URL").required("Other URL is required"),
});

interface FormData {
  name: string;
  motto: string;
  farewell_message: string;
  contact_number: string;
  contact_email: string;
  address: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_sort_code: string;
  support_hours: string;
  support_phone: string;
  facebook_url: string;
  instagram_url: string;
  other_url: string;
}

interface CompanyFormProps {
  company: Company | null;
  setRefetch: (value: boolean) => void;
  onClose: () => void;
}

const CompanyForm: React.FC<CompanyFormProps> = ({ company, setRefetch, onClose }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: company ? {
      name: company.name,
      motto: company.motto,
      farewell_message: company.farewell_message,
      contact_number: company.contact_number,
      contact_email: company.contact_email,
      address: company.address,
      bank_name: company.bank_name,
      bank_account_name: company.bank_account_name,
      bank_account_number: company.bank_account_number,
      bank_sort_code: company.bank_sort_code,
      support_hours: company.support_hours,
      support_phone: company.support_phone,
      facebook_url: company.facebook_url,
      instagram_url: company.instagram_url,
      other_url: company.other_url,
    } : {},
  });

  const api = getApiClientInstance();

  const onSubmit = async (data: FormData) => {
    try {
      const updateData = { id: company?.id, ...data };
      const res = await api.put("/permissions/update-company-detail", updateData);
      if (res.data.success) {
        toast.success("Company updated successfully");
        setRefetch(true);
        onClose();
      } else {
        toast.error("Failed to update company");
      }
    } catch (err) {
      console.error("Error updating company:", err);
      toast.error("Error updating company");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              type="text"
              className={`form-control ${errors.name ? "is-invalid" : ""}`}
              id="name"
              {...register("name")}
            />
            {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="motto" className="form-label">Motto</label>
            <input
              type="text"
              className={`form-control ${errors.motto ? "is-invalid" : ""}`}
              id="motto"
              {...register("motto")}
            />
            {errors.motto && <div className="invalid-feedback">{errors.motto.message}</div>}
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="farewell_message" className="form-label">Farewell Message</label>
            <input
              type="text"
              className={`form-control ${errors.farewell_message ? "is-invalid" : ""}`}
              id="farewell_message"
              {...register("farewell_message")}
            />
            {errors.farewell_message && <div className="invalid-feedback">{errors.farewell_message.message}</div>}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="contact_number" className="form-label">Contact Number</label>
            <input
              type="text"
              className={`form-control ${errors.contact_number ? "is-invalid" : ""}`}
              id="contact_number"
              {...register("contact_number")}
            />
            {errors.contact_number && <div className="invalid-feedback">{errors.contact_number.message}</div>}
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="contact_email" className="form-label">Contact Email</label>
            <input
              type="email"
              className={`form-control ${errors.contact_email ? "is-invalid" : ""}`}
              id="contact_email"
              {...register("contact_email")}
            />
            {errors.contact_email && <div className="invalid-feedback">{errors.contact_email.message}</div>}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="address" className="form-label">Address</label>
            <input
              type="text"
              className={`form-control ${errors.address ? "is-invalid" : ""}`}
              id="address"
              {...register("address")}
            />
            {errors.address && <div className="invalid-feedback">{errors.address.message}</div>}
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="bank_name" className="form-label">Bank Name</label>
            <input
              type="text"
              className={`form-control ${errors.bank_name ? "is-invalid" : ""}`}
              id="bank_name"
              {...register("bank_name")}
            />
            {errors.bank_name && <div className="invalid-feedback">{errors.bank_name.message}</div>}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="bank_account_name" className="form-label">Bank Account Name</label>
            <input
              type="text"
              className={`form-control ${errors.bank_account_name ? "is-invalid" : ""}`}
              id="bank_account_name"
              {...register("bank_account_name")}
            />
            {errors.bank_account_name && <div className="invalid-feedback">{errors.bank_account_name.message}</div>}
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="bank_account_number" className="form-label">Bank Account Number</label>
            <input
              type="text"
              className={`form-control ${errors.bank_account_number ? "is-invalid" : ""}`}
              id="bank_account_number"
              {...register("bank_account_number")}
            />
            {errors.bank_account_number && <div className="invalid-feedback">{errors.bank_account_number.message}</div>}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="bank_sort_code" className="form-label">Bank Sort Code</label>
            <input
              type="text"
              className={`form-control ${errors.bank_sort_code ? "is-invalid" : ""}`}
              id="bank_sort_code"
              {...register("bank_sort_code")}
            />
            {errors.bank_sort_code && <div className="invalid-feedback">{errors.bank_sort_code.message}</div>}
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="support_hours" className="form-label">Support Hours</label>
            <input
              type="text"
              className={`form-control ${errors.support_hours ? "is-invalid" : ""}`}
              id="support_hours"
              {...register("support_hours")}
            />
            {errors.support_hours && <div className="invalid-feedback">{errors.support_hours.message}</div>}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="support_phone" className="form-label">Support Phone</label>
            <input
              type="text"
              className={`form-control ${errors.support_phone ? "is-invalid" : ""}`}
              id="support_phone"
              {...register("support_phone")}
            />
            {errors.support_phone && <div className="invalid-feedback">{errors.support_phone.message}</div>}
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="facebook_url" className="form-label">Facebook URL</label>
            <input
              type="url"
              className={`form-control ${errors.facebook_url ? "is-invalid" : ""}`}
              id="facebook_url"
              {...register("facebook_url")}
            />
            {errors.facebook_url && <div className="invalid-feedback">{errors.facebook_url.message}</div>}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="instagram_url" className="form-label">Instagram URL</label>
            <input
              type="url"
              className={`form-control ${errors.instagram_url ? "is-invalid" : ""}`}
              id="instagram_url"
              {...register("instagram_url")}
            />
            {errors.instagram_url && <div className="invalid-feedback">{errors.instagram_url.message}</div>}
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="other_url" className="form-label">Other URL</label>
            <input
              type="url"
              className={`form-control ${errors.other_url ? "is-invalid" : ""}`}
              id="other_url"
              {...register("other_url")}
            />
            {errors.other_url && <div className="invalid-feedback">{errors.other_url.message}</div>}
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          Update
        </Button>
      </div>
    </form>
  );
};

export default CompanyForm;