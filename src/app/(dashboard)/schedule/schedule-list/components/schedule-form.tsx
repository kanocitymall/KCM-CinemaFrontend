"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";

interface ScheduleFormData {
  program_id: string;
  hall_id: string;
  details: string;
  date: string;
  starttime: string;
  endtime: string;
  regular_price: string;
  vip_price: string;
}

interface Program {
  id: number;
  title: string;
}

interface Hall {
  id: number;
  name: string;
}

interface ScheduleFormProps {
  onSuccess?: () => void;
  programId?: number;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ onSuccess, programId }) => {
  const api = useMemo(() => getApiClientInstance(), []);
  
  const [formData, setFormData] = useState<ScheduleFormData>({
    program_id: programId ? String(programId) : "",
    hall_id: "",
    details: "",
    date: "",
    starttime: "",
    endtime: "",
    regular_price: "",
    vip_price: "",
  });

  const [programs, setPrograms] = useState<Program[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [programsRes, hallsRes] = await Promise.all([
          api.get("/programs?page=1"),
          api.get("/halls"),
        ]);

        // Handle programs response - it has pagination structure
        if (programsRes.data?.data?.data && Array.isArray(programsRes.data.data.data)) {
          setPrograms(programsRes.data.data.data);
        } else if (programsRes.data?.data && Array.isArray(programsRes.data.data)) {
          setPrograms(programsRes.data.data);
        } else {
          setPrograms([]);
        }

        // Handle halls response
        if (hallsRes.data?.data && Array.isArray(hallsRes.data.data)) {
          setHalls(hallsRes.data.data);
        } else {
          setHalls([]);
        }
      } catch (err) {
        console.error("Failed to load programs and halls", err);
        toast.error("Failed to load programs and halls");
        setPrograms([]);
        setHalls([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [api]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Convert time from HH:mm format to g:i A format (e.g., "08:30" -> "8:30 AM")
  const convertTimeFormat = (time: string): string => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.program_id || !formData.hall_id || !formData.date || !formData.starttime || !formData.endtime) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (parseFloat(formData.regular_price) < 0 || parseFloat(formData.vip_price) < 0) {
      toast.error("Prices cannot be negative");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        program_id: parseInt(formData.program_id),
        hall_id: parseInt(formData.hall_id),
        details: formData.details,
        date: formData.date,
        starttime: convertTimeFormat(formData.starttime),
        endtime: convertTimeFormat(formData.endtime),
        regular_price: parseFloat(formData.regular_price) || 0,
        vip_price: parseFloat(formData.vip_price) || 0,
      };

      const response = await api.post("/bookings/create-schedule", payload);

      if (response.data?.success) {
        toast.success("Schedule created successfully");
        // Reset form
        setFormData({
          program_id: programId ? String(programId) : "",
          hall_id: "",
          details: "",
          date: "",
          starttime: "",
          endtime: "",
          regular_price: "",
          vip_price: "",
        });
        if (onSuccess) {
          onSuccess();
        }
      }
      } catch (error: AxiosError<{ message?: string }> | unknown) {
      let errorMessage = "Failed to create schedule";
      
      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // Check if it's an overlap error
        if (errorMessage.toLowerCase().includes("overlap")) {
          errorMessage = "Schedule overlaps with an existing one. Please change the time or date.";
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="card shadow-sm border-0 rounded-4 p-4 mb-4">
      <h5 className="fw-bold mb-4">Create New Schedule</h5>
      <Form onSubmit={handleSubmit}>
        <div className="row">
          {/* Program ID */}
          <div className="col-md-6 mb-3">
            <Form.Group>
              <Form.Label className="fw-semibold">
                Program <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                name="program_id"
                value={formData.program_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a program</option>
                {programs.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>

          {/* Hall ID */}
          <div className="col-md-6 mb-3">
            <Form.Group>
              <Form.Label className="fw-semibold">
                Hall <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                name="hall_id"
                value={formData.hall_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a hall</option>
                {halls.map((hall) => (
                  <option key={hall.id} value={hall.id}>
                    {hall.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>

          {/* Date */}
          <div className="col-md-6 mb-3">
            <Form.Group>
              <Form.Label className="fw-semibold">
                Date <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
          </div>

          {/* Start Time */}
          <div className="col-md-6 mb-3">
            <Form.Group>
              <Form.Label className="fw-semibold">
                Start Time <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="time"
                name="starttime"
                value={formData.starttime}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
          </div>

          {/* End Time */}
          <div className="col-md-6 mb-3">
            <Form.Group>
              <Form.Label className="fw-semibold">
                End Time <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="time"
                name="endtime"
                value={formData.endtime}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
          </div>

          {/* Regular Price */}
          <div className="col-md-6 mb-3">
            <Form.Group>
              <Form.Label className="fw-semibold">
                Regular Price <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="number"
                name="regular_price"
                placeholder="0"
                value={formData.regular_price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
              />
            </Form.Group>
          </div>

          {/* VIP Price */}
          <div className="col-md-6 mb-3">
            <Form.Group>
              <Form.Label className="fw-semibold">
                VIP Price <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="number"
                name="vip_price"
                placeholder="0"
                value={formData.vip_price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
              />
            </Form.Group>
          </div>

          {/* Details */}
          <div className="col-12 mb-3">
            <Form.Group>
              <Form.Label className="fw-semibold">Details</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="details"
                placeholder="Additional details about this schedule..."
                value={formData.details}
                onChange={handleInputChange}
              />
            </Form.Group>
          </div>
        </div>

        {/* Submit Button */}
        <div className="d-flex gap-2">
          <Button
            variant="primary"
            type="submit"
            disabled={submitting}
            className="btn btn-warning d-flex align-items-center gap-2 text-nowrap"
          >
            {submitting ? "Creating..." : "Create Schedule"}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ScheduleForm;
