"use client";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { Spinner, Form, Button, Card, Row, Col, Table } from "react-bootstrap";

import { toast } from "react-toastify";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
// import { useSelector } from "react-redux";
// import { RootState } from "@/store";

interface ServiceType {
  id: number;
  name: string;
  status: number | boolean;
}

interface Service {
  id: number;
  name: string;
  price: number;
  service_type_id: number;
  status: number | boolean;
}

interface BookingFormData {
  hall_name: string;
  hall_id: number | "";
  hall_price: number;
  checkin_price: number;
  date: string;
  starttime: string;
  endtime: string;
  participants_no: number;
  participants_checkin: boolean;
  agent_code: string;
  client_code: string;
  // Event title and details separated
  event_title: string;
  event_details: string;
  booking_services: BookingService[];
  // New seat-based booking fields
  schedule_id?: number;
  customer_id?: number;
  walkin_customer_name?: string;
  walkin_customer_no?: string;
  walkin_customer_email?: string;
  booking_seats?: number[];
}

export interface BookingService {
  service_id: number;
  quantity: number;
}

export interface HallBooking {
  id?: number;
  hall_id?: number | "";
  hall_name?: string;
  hall_price?: number;
  participant_unit_price?: number;
  checkin_price?: number;
  date?: string;
  starttime?: string;
  endtime?: string;
  participants_no?: number;
  participants_checkin?: boolean;
  agent_code?: string;
  client_code?: string;
  event_title?: string;
  event_details?: string;
  // This was missing and caused most errors:
  booking_services?: RawService[]; 
  hall?: {
    id: number;
    name: string;
    price: number;
  };
  title?: string;
}

// This allows us to use bp as ExtendedHallBooking to handle API variations
export type ExtendedHallBooking = HallBooking;
 interface ServicePivot {
  quantity?: number;
}

interface RawService {
  id?: number | string;
  service_id?: number | string;
  quantity?: number;
  qty?: number;
  service?: { id: number; name?: string; price?: number };
  pivot?: ServicePivot;
}

// interface ExtendedHallBooking extends HallBooking {
//   hall?: { name?: string; price?: number };
//   participant_unit_price?: number;
//   title?: string;
// }
export interface HallBooking {
  id?: number;
  hall_id?: number | ""; // Allow empty string for form initialization
  hall_name?: string;
  hall_price?: number;
  date?: string;
  starttime?: string;
  endtime?: string;
  // ... other existing fields
  
  // Add these to fix the "Property does not exist" errors
  hall?: {
    id: number;
    name: string;
    price: number;
  };
  title?: string; 
}
interface Props {
  booking?: HallBooking | null;
  onSuccess?: () => void;
  onClose?: () => void;
  prefilledData?: {
    booking_seats?: number[];
    schedule_id?: number;
    customer_id?: number;
    walkin_customer_name?: string;
    walkin_customer_no?: string;
    walkin_customer_email?: string;
  };
}

export default function BookingForm({
  booking: bookingProp = null,
  onSuccess,
  onClose,
  prefilledData = {},
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // ✅ Get auth user to determine role for hiding agent/client fields

  const [bookingId, setBookingId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Tracks if hall/time selection was done prior to this form (via URL)
  const [isHallPreselected, setIsHallPreselected] = useState(false);

  const [form, setForm] = useState<BookingFormData>({
    hall_id: "",
    hall_name: "",
    hall_price: 0,
    checkin_price: 0,
    date: "",
    starttime: "",
    endtime: "",
    participants_no: 1,
    participants_checkin: false,
    agent_code: "",
    client_code: "",
    event_title: "",
    event_details: "",
    booking_services: [],
    // Initialize with prefilled data
    schedule_id: prefilledData.schedule_id,
    customer_id: prefilledData.customer_id,
    walkin_customer_name: prefilledData.walkin_customer_name || "",
    walkin_customer_no: prefilledData.walkin_customer_no || "",
    walkin_customer_email: prefilledData.walkin_customer_email || "",
    booking_seats: prefilledData.booking_seats || [],
  });

  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
const [servicesForType, setServicesForType] = useState<Service[]>([]);
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState<number | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedServiceQty, setSelectedServiceQty] = useState<number>(1);
  const [servicesCache, setServicesCache] = useState<Record<number, { name: string; price: number }>>({});
  const [servicesLoadedForEdit, setServicesLoadedForEdit] = useState<boolean>(true);
  const [vatRate, setVatRate] = useState<number>(0.075); // default to 7.5%

  // Keep a ref of servicesCache so callbacks can access the latest value
  const servicesCacheRef = useRef(servicesCache);
  useEffect(() => {
    servicesCacheRef.current = servicesCache;
  }, [servicesCache]);

  // Fetch company details for VAT rate
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const api = getApiClientInstance();
        const res = await api.get("/permissions/get-company-detail");
        if (res.data.success && res.data.data.vat_rate) {
          setVatRate(res.data.data.vat_rate / 100); // assuming vat_rate is in percentage
        }
      } catch (err) {
        console.error("Failed to fetch company details for VAT rate", err);
      }
    };
    fetchCompanyDetails();
  }, []);

  // Fetch service types
  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const api = getApiClientInstance();
        let page = 1;
        let all: ServiceType[] = [];
        let last = 1;
        do {
          const res = await api.get(`/services/servicetypes?page=${page}`);
          const data = res.data?.data;
          if (data?.data) {
            all = [...all, ...data.data];
            last = data.last_page ?? 1;
          } else if (Array.isArray(data)) {
            all = data;
            last = 1;
          }
          page++;
        } while (page <= last);
        setServiceTypes(all.filter((st) => st.status === 1 || st.status === true));
      } catch (err) {
        console.error("Failed to fetch service types", err);
        setServiceTypes([]);
      }
    };
    fetchServiceTypes();
  }, []);

  const MODAL_WIDTH = 780;

  // VAT rate - now fetched from API
  // const VAT_RATE = 0.075; // 7.5% - removed hardcoded

  // Calculate totals
  const hallPrice = form.hall_price || 0;
  const participantsTotal = form.participants_checkin && form.participants_no ? Number(form.participants_no) * (form.checkin_price || 0) : 0;

  const servicesTotal = form.booking_services?.reduce((acc, b) => {
    const meta = servicesCache[b.service_id];
    if (meta && b.quantity) {
      return acc + (meta.price * b.quantity);
    }
    return acc;
  }, 0) || 0;

  // Subtotal is the sum of all items before VAT
  const subtotal = hallPrice + participantsTotal + servicesTotal;

  // Calculate VAT as percentage of subtotal (exclusive)
  const vatAmount = subtotal * vatRate;

  // Total Payable is the subtotal plus VAT
  const grandTotal = subtotal + vatAmount;

  // fetch service details by ids
  const fetchServicesByIds = async (ids: number[]) => {
    if (!ids || ids.length === 0) return {};
    const api = getApiClientInstance();
    const fetched: Record<number, { name: string; price: number }> = {};
    try {
      const promises = ids.map((id: number) =>
        api.get(`/services/${id}`).then((r) => r.data?.data).catch(() => null)
      );
      const results = await Promise.all(promises);
      results.forEach((svc: Service | null) => {
  if (svc?.id) {
    fetched[svc.id] = {
      name: svc.name ?? `Service ${svc.id}`,
      price: Number(svc.price ?? 0),
    };
  }
});

    } catch (err) {
      console.warn("Failed fetching services by ids", err);
    }
    return fetched;
  };

  // populate cache using raw booking object
  const populateServicesCacheForBooking = useCallback(async (rawBooking: HallBooking | null) => {
    if (!rawBooking || !Array.isArray(rawBooking.booking_services)) {
      setServicesLoadedForEdit(true);
      return;
    }

    const ids: number[] = rawBooking.booking_services
      .map((b: { service_id?: number | string; id?: number | string; service?: { id: number } }) =>
        Number(b.service_id || b.id || b.service?.id)
      )
      .filter((id): id is number => Boolean(id));

    if (ids.length === 0) {
      setServicesLoadedForEdit(true);
      return;
    }

    setServicesLoadedForEdit(false);

    try {
      const fromEmbedded: Record<number, { name: string; price: number }> = {};

      rawBooking.booking_services.forEach((b: {
        service_id?: number | string;
        id?: number | string;
        name?: string;
        price?: number | string;
        service?: { id: number; name?: string; price?: number | string };
      }) => {
        const id = Number(b.service_id || b.id || b.service?.id);
        if (!id) return;

        if (b.service && b.service.id) {
          fromEmbedded[id] = {
            name: b.service.name || `Service ${id}`,
            price: Number(b.service.price ?? b.price ?? 0),
          };
        } else if (b.name || b.price) {
          fromEmbedded[id] = { name: b.name || `Service ${id}`, price: Number(b.price ?? 0) };
        }
      });

      const currentCache = servicesCacheRef.current || {};
      const toFetch = ids.filter((id) => !fromEmbedded[id] && !currentCache[id]);
      const fetched = await fetchServicesByIds(toFetch);

      setServicesCache((prev) => ({ ...prev, ...fromEmbedded, ...fetched }));
    } catch (err) {
      console.warn("Failed to populate services cache for booking", err);
    } finally {
      setServicesLoadedForEdit(true);
    }
  }, []);

  // when parent passes booking prop (modal edit), populate form and cache immediately
  useEffect(() => {
    if (!bookingProp) return;

    setIsEditMode(true);
    setServicesLoadedForEdit(false);
    if (bookingProp.id) setBookingId(Number(bookingProp.id));

    // Cast once at the top to avoid repeating 'as any'
const bp = bookingProp as ExtendedHallBooking;

const bookingServices: BookingService[] = (bp.booking_services || [])
  .map((b: RawService) => {
    const serviceId = Number(b.service_id || b.id || b.service?.id);
    const quantity = Number(b.quantity ?? b.pivot?.quantity ?? b.qty ?? 0);
    return { service_id: serviceId, quantity };
  })
  .filter((b: BookingService) => Number(b.service_id) > 0);

setForm({
  hall_id: bp.hall_id ?? "",
  hall_name: bp.hall_name ?? bp.hall?.name ?? "",
  hall_price: Number(bp.hall_price ?? bp.hall?.price ?? 0),
  checkin_price: Number(bp.checkin_price ?? bp.participant_unit_price ?? 0),
  date: bp.date ?? "",
  starttime: bp.starttime ?? "",
  endtime: bp.endtime ?? "",
  participants_no: Number(bp.participants_no ?? 1),
  participants_checkin: Boolean(bp.participants_checkin ?? false),
  agent_code: bp.agent_code ?? "",
  client_code: bp.client_code ?? "",
  event_title: bp.event_title ?? bp.title ?? "",
  event_details: bp.event_details ?? "",
  booking_services: bookingServices,
});
    (async () => {
      await populateServicesCacheForBooking(bookingProp);
    })();

    if (bookingProp?.id) {
      toast.info(`Editing Booking ID: ${bookingProp.id}`);
    }
  }, [bookingProp, populateServicesCacheForBooking]);

  // load bookingId or prefill from URL/localStorage (create flow)
  useEffect(() => {
    if (bookingProp) return;

    const params = new URLSearchParams(window.location.search);
    const urlBookingId = params.get("booking_id");
    if (urlBookingId) {
      const id = Number(urlBookingId);
      if (!isNaN(id)) {
        setBookingId(id);
        setIsEditMode(true);
      }
    }

    const hall_id_param = params.get("hall_id");
    const hall_name_param = params.get("hall_name");
    const date_param = params.get("date");
    const start_time_param = params.get("start_time");
    const end_time_param = params.get("end_time");
    const participants_checkin_param = params.get("participants_checkin");

    // Check if enough parameters are present for pre-selection (Hall Details Page Flow)
    if (hall_id_param && date_param && start_time_param && end_time_param) {
      setIsHallPreselected(true); // Key to lock the fields

      setForm((p) => ({
        ...p,
        hall_id: Number(hall_id_param),
        hall_name: hall_name_param ? decodeURIComponent(hall_name_param) : p.hall_name,
        date: date_param,
        starttime: decodeURIComponent(start_time_param),
        endtime: decodeURIComponent(end_time_param),
        participants_checkin: participants_checkin_param ? participants_checkin_param === "true" : p.participants_checkin,
      }));
      // Exit here to prioritize URL parameters over localStorage for the pre-selected flow
      return;
    }

    // Load from localStorage only if no pre-selection via URL
    const saved = localStorage.getItem("bookingData");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setForm((p) => ({
          ...p,
          ...data,
          client_code: data.client_code ?? p.client_code,
          // Load event_title & event_details from localStorage if present
          event_title: data.event_title ?? p.event_title,
          event_details: data.event_details ?? p.event_details,
        }));
      } catch {
        console.warn("Invalid saved booking data");
      }
    }
  }, [bookingProp]);

  // if only bookingId present, fetch booking then populate cache using raw booking
  useEffect(() => {
    if (!bookingId) return;
    if (bookingProp && bookingProp.id && Number(bookingProp.id) === Number(bookingId)) return;

    const api = getApiClientInstance();

    const fetchBookingDetails = async () => {
  setLoading(true);
  setServicesLoadedForEdit(false);
  try {
    const res = await api.get(`/bookings/get-booking/${bookingId}`);
    // Specify the type for the booking variable
    const booking: HallBooking | null = res.data?.data;

    if (booking) {
      // ✅ FIX: Changed (b: any) to (b: RawService)
      const bookingServices: BookingService[] = (booking.booking_services || [])
        .map((b: RawService) => {
          const serviceId = Number(b.service_id || b.id || b.service?.id);
          const quantity = Number(b.quantity ?? b.pivot?.quantity ?? b.qty ?? 0);
          return { service_id: serviceId, quantity };
        })
        // ✅ FIX: Changed (b: any) to (b: BookingService)
        .filter((b: BookingService) => Number(b.service_id) > 0);
      setForm({
        hall_id: booking.hall_id ?? "",
        hall_name: booking.hall_name ?? booking.hall?.name ?? "",
        hall_price: Number(booking.hall_price ?? booking.hall?.price ?? 0),
        
        // ✅ Add this line to satisfy the TypeScript requirement:
        checkin_price: Number(booking.checkin_price ?? booking.participant_unit_price ?? 0),

        date: booking.date ?? "",
        starttime: booking.starttime ?? "",
        endtime: booking.endtime ?? "",
        participants_no: Number(booking.participants_no ?? 1),
        participants_checkin: Boolean(booking.participants_checkin ?? false),
        agent_code: booking.agent_code ?? "",
        client_code: booking.client_code ?? "",
        event_title: booking.event_title ?? booking.title ?? "",
        event_details: booking.event_details ?? "",
        booking_services: bookingServices,
      });

      await populateServicesCacheForBooking(booking);
      if (booking?.id || bookingId) {
        toast.info(`Editing Booking ID: ${booking?.id ?? bookingId}`);
      }
    } else {
      toast.error("Booking not found.");
      if (onClose) onClose();
      else router.push("/booking/booking-list");
    }
  } catch (err: unknown) {
    // Use a type guard to safely log the error message
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Failed to fetch booking details for edit", errorMsg);
    toast.error("Failed to load booking details.");
  } finally {
        setLoading(false);
      }
    };

   fetchBookingDetails();
  }, [bookingId, router, bookingProp, onClose, populateServicesCacheForBooking]); // Added here


  // when service type selected load services & cache
  useEffect(() => {
    if (!selectedServiceTypeId) {
      setServicesForType([]);
      return;
    }

    const api = getApiClientInstance();
    (async () => {
      try {
        let page = 1;
        let all: Service[] = [];

        let last = 1;
        do {
          const res = await api.get(`/services?page=${page}`);
          const data = res.data?.data;
          if (data?.data) {
            all = [...all, ...data.data];
            last = data.last_page || 1;
          } else if (Array.isArray(res.data?.data)) {
            all = res.data.data;
            last = 1;
          }
          page++;
        } while (page <= last);

        const filtered = all.filter(
  (s: Service) =>
    Number(s.service_type_id) === Number(selectedServiceTypeId) &&
    (s.status === 1 || s.status === true)
);

        setServicesForType(filtered);
        setServicesCache((p) => {
          const next = { ...p };
          filtered.forEach((s: Service) => {
  next[s.id] = { name: s.name, price: Number(s.price || 0) };
});

          return next;
        });
      } catch (err) {
        console.warn("Failed to load services for type", err);
        setServicesForType([]);
      }
    })();
  }, [selectedServiceTypeId]);

  useEffect(() => {
  if (!servicesForType || servicesForType.length === 0) return;
  
  setServicesCache((p) => {
    const next = { ...p };
    // ✅ FIX: Replace (s: any) with (s: Service)
    servicesForType.forEach((s: Service) => {
      next[s.id] = { 
        name: s.name, 
        price: Number(s.price || 0) 
      };
    });
    return next;
  });
}, [servicesForType]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setForm((p) => ({ ...p, participants_checkin: checked }));
  };

  // fetch hall details if needed
  useEffect(() => {
    const hallId = form.hall_id;
    if (!hallId) return;
    if (form.hall_name && String(form.hall_name).trim().length > 0) return;

    let cancelled = false;
    const api = getApiClientInstance();

    (async () => {
      try {
        const res = await api.get(`/halls/get-hall/${Number(hallId)}`);
        const hall = res.data?.data;
        if (!cancelled && hall && hall.name) {
          setForm((p) => ({
            ...p,
            hall_name: hall.name,
            hall_price: hall.price ? Number(hall.price) : p.hall_price,
            checkin_price: hall.checkin_price ? Number(hall.checkin_price) : p.checkin_price,
          }));
        }
      } catch (err) {
        console.warn("Failed to fetch hall name for booking form", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form.hall_id, form.hall_name]);

  // unified change handler that also persists to localStorage when not editing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement | HTMLTextAreaElement;
    const parsed = name === "participants_no" ? Number(value) : value;

    setForm((prev) => {
      const next = { ...prev, [name]: parsed } as BookingFormData;
      if (!isEditMode) {
        try {
          localStorage.setItem("bookingData", JSON.stringify(next));
        } catch {
          /* ignore storage errors */
        }
      }
      return next;
    });
  };

  // service handlers

  const handleRemoveService = (serviceId: number) => {
    setForm((p) => ({ ...p, booking_services: p.booking_services.filter((b) => b.service_id !== serviceId) }));
  };

  const addSelectedService = () => {
    if (!selectedServiceId) return;
    const svcId = Number(selectedServiceId);
    const qty = Number(selectedServiceQty) || 1;

    const svcObj = servicesForType.find((s) => Number(s.id) === svcId);
    if (svcObj) setServicesCache((p) => ({ ...p, [svcId]: { name: svcObj.name, price: Number(svcObj.price || 0) } }));

    setForm((p) => {
      const exists = p.booking_services.find((b) => b.service_id === svcId);
      if (exists) {
        return { ...p, booking_services: p.booking_services.map((b) => (b.service_id === svcId ? { ...b, quantity: (b.quantity || 0) + qty } : b)) };
      }
      return { ...p, booking_services: [...p.booking_services, { service_id: svcId, quantity: qty }] };
    });

    setSelectedServiceId(null);
    setSelectedServiceQty(1);
  };

  const updateServiceQuantity = (serviceId: number, qty: number) => {
    setForm((p) => ({ ...p, booking_services: p.booking_services.map((b) => (b.service_id === serviceId ? { ...b, quantity: qty } : b)) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (form.participants_checkin && (!form.participants_no || Number(form.participants_no) < 1)) {
      toast.error("Please enter number of participants (minimum 1) before submitting.");
      setLoading(false);
      return;
    }

    try {
      const participantsTotal = form.participants_checkin && form.participants_no ? Number(form.participants_no) * (form.checkin_price || 0) : 0;
      const cleanedBookingServices = (form.booking_services || []).filter((b) => Number(b.service_id) > 0 && Number(b.quantity) > 0);
const servicesPricesMap: Record<number, number> = {};

cleanedBookingServices.forEach((b: BookingService) => {
  const cached = servicesCache[b.service_id];
  
  if (cached && typeof cached.price === "number") {
    servicesPricesMap[b.service_id] = cached.price;
  } else {
    // ✅ FIX: Replace (s: any) with (s: Service)
    const svc = servicesForType.find((s: Service) => Number(s.id) === Number(b.service_id));
    servicesPricesMap[b.service_id] = svc ? Number(svc.price || 0) : 0;
  }
});

      const servicesTotal = cleanedBookingServices.reduce((acc, b) => {
        const price = servicesPricesMap[b.service_id] || 0;
        return acc + price * (b.quantity || 0);
      }, 0);

      if (cleanedBookingServices.length < (form.booking_services || []).length) toast.warn("Some invalid services were removed before submission.");

      // Validate required fields
      if (!form.event_title.trim()) {
        toast.error("Event title is required.");
        setLoading(false);
        return;
      }

      if (!form.event_details.trim()) {
        toast.error("Event details is required.");
        setLoading(false);
        return;
      }

      if (!form.client_code.trim()) {
        toast.error("Client code is required.");
        setLoading(false);
        return;
      }

      const payload = {
        ...form,
        hall_id: Number(form.hall_id),
        participants_checkin: Boolean(form.participants_checkin),
        participant_unit_price: form.checkin_price || 0,
        participants_total: participantsTotal,
        hall_price: form.hall_price || 0,
        checkin_price: form.checkin_price || 0,
        services_total: servicesTotal,
        booking_services: cleanedBookingServices,
        subtotal: subtotal,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        grand_total: grandTotal,
        // client_code required for all users
        client_code: form.client_code,
        // include both title & details in payload
        event_title: form.event_title,
        title: form.event_title,
        event_details: form.event_details,
        // Include new seat-based booking fields if available
        ...(form.schedule_id && { schedule_id: form.schedule_id }),
        ...(form.customer_id && { customer_id: form.customer_id }),
        ...(form.walkin_customer_name && { walkin_customer_name: form.walkin_customer_name }),
        ...(form.walkin_customer_no && { walkin_customer_no: form.walkin_customer_no }),
        ...(form.walkin_customer_email && { walkin_customer_email: form.walkin_customer_email }),
        ...(form.booking_seats && form.booking_seats.length > 0 && { booking_seats: form.booking_seats }),
      };

      const apiCall = getApiClientInstance();
      if (isEditMode && bookingId) {
        await apiCall.put(`/bookings/update-booking/${bookingId}`, payload);
        toast.success(`🎉 Booking ID ${bookingId} updated successfully!`);
        onSuccess?.();
        onClose?.();
      } else {
        await apiCall.post(`/bookings/book-hall`, payload);
        toast.success("🎉 Booking successful!");
        localStorage.removeItem("bookingData");
        onSuccess?.();
        onClose?.();
      }
if (!onClose) router.push("/booking/booking-list");
  } catch (err: unknown) {
    console.error(err);
    
    // Safely extract the error message from the API response
    let message = `❌ ${isEditMode ? "Update" : "Booking"} failed. Try again.`;
    
    // Narrow the type to check for Axios-style error structures
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response: { data: { message?: string; data?: string[] } } };
      
      // First check if there's a data array with specific error messages
      if (axiosErr.response?.data?.data && Array.isArray(axiosErr.response.data.data) && axiosErr.response.data.data.length > 0) {
        message = axiosErr.response.data.data[0]; // Display the first error from the data array
      } else if (axiosErr.response?.data?.message) {
        message = axiosErr.response.data.message;
      }
    } else if (err instanceof Error) {
      message = err.message;
    }

    toast.error(message);
  } finally {
    setLoading(false);
  }
};

  // injected CSS ensures component expands when placed inside a Bootstrap modal
  const modalOverrideStyle = `
        /* widen modal dialog when this component is rendered inside */
        .booking-form-modal { max-width: ${MODAL_WIDTH}px !important; width: 100% !important; }
        .modal-dialog { max-width: ${MODAL_WIDTH}px !important; }
        .modal-content { max-width: ${MODAL_WIDTH}px; width: 100%; }
    `;

  return (
    <div className="container py-5 d-flex justify-content-center">
      <style>{modalOverrideStyle}</style>
      <div className="booking-form-modal" style={{ maxWidth: MODAL_WIDTH, width: "100%" }}>
        <Card className="shadow-lg border-0 rounded-4 p-4">
          <Card.Body>
            <div className="mb-3">
              <button type="button" className="btn btn-primary px-3 d-flex align-items-center gap-2" onClick={() => router.back()}>
                <FiArrowLeft className="me-1" /> Back
              </button>
            </div>
            <h3 className="text-center text-primary fw-bold mb-4">{"Complete Your Booking"}</h3>

            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Hall Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="hall_name"
                      value={form.hall_name}
                      readOnly
                      placeholder="Selected hall"
                    />
                    <Form.Control type="hidden" name="hall_id" value={String(form.hall_id)} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Date</Form.Label>
                    <Form.Control type="text" name="date" value={form.date} readOnly={isHallPreselected || isEditMode} onChange={handleChange} />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Start Time</Form.Label>
                    <Form.Control type="text" name="starttime" value={form.starttime} readOnly={isHallPreselected || isEditMode} onChange={handleChange} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">End Time</Form.Label>
                    <Form.Control type="text" name="endtime" value={form.endtime} readOnly={isHallPreselected || isEditMode} onChange={handleChange} />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Row className="align-items-center gx-3">
                  <Col xs="auto" className="d-flex align-items-center">
                    <Form.Check
                      type="checkbox"
                      id="participants_checkin"
                      label="Participants will check in"
                      checked={form.participants_checkin}
                      onChange={handleCheckboxChange}
                    />
                  </Col>
                  {form.participants_checkin && (
                    <Col>
                      <Form.Label className="fw-semibold mb-1">Number of Participants</Form.Label>
                      <Form.Control type="number" name="participants_no" value={form.participants_no} min={1} onChange={handleChange} required />
                      <div className="small text-muted mt-1">
                        <span>Charge per participant: ₦{Number(form.checkin_price || 0).toLocaleString()}</span>
                        <span className="mx-2">•</span>
                        <span className="fw-semibold">Total: ₦{(Number(form.checkin_price || 0) * Number(form.participants_no || 0)).toLocaleString()}</span>
                      </div>
                    </Col>
                  )}
                </Row>
                {!form.participants_checkin && <div className="text-muted small mt-1">Check the box to add participants</div>}
              </Form.Group>

              {/* Agent and Client Codes Row - Required for all users */}
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Agent Code</Form.Label>
                    <Form.Control type="text" name="agent_code" value={form.agent_code} onChange={handleChange} placeholder="Enter agent code" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Client Code *</Form.Label>
                    <Form.Control type="text" name="client_code" value={form.client_code} onChange={handleChange} placeholder="Enter client code (e.g., CLT123)" required />
                  </Form.Group>
                </Col>
              </Row>

              {/* Event Title */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Event Title *</Form.Label>
                <Form.Control
                  type="text"
                  name="event_title"
                  placeholder="New Event Gathering"
                  value={form.event_title}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 30) {
                      handleChange(e);
                    }
                  }}
                  required
                  maxLength={30}
                />
                <small className="text-muted">{form.event_title.length}/30 characters</small>
              </Form.Group>

              {/* Event Details */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Event Details *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="event_details"
                  value={form.event_details}
                  onChange={handleChange}
                  placeholder="e.g., Wedding reception, Corporate retreat, Birthday party"
                  required
                />
              </Form.Group>

              {/* Booking Services Section */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Booking Services</Form.Label>
                <Row className="mb-2 g-2 align-items-end">
                  <Col md={5}>
                    <label className="form-label">Service Type</label>
                    <select
                      className="form-select"
                      value={selectedServiceTypeId ?? ""}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        setSelectedServiceTypeId(val);
                        setSelectedServiceId(null);
                      }}
                    >
                      <option value="">Select service type</option>
                      {serviceTypes.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </Col>

                  <Col md={4}>
                    <label className="form-label">Service</label>
                    <select
                      className="form-select"
                      value={selectedServiceId ?? ""}
                      onChange={(e) => setSelectedServiceId(e.target.value ? Number(e.target.value) : null)}
                      disabled={!servicesForType || servicesForType.length === 0}
                    >
                      <option value="">Select service</option>
                      {servicesForType.map((svc) => (
                        <option key={svc.id} value={svc.id}>
                          {svc.name} - ₦{svc.price}
                        </option>
                      ))}
                    </select>
                  </Col>

                  <Col md={3}>
                    <label className="form-label">Qty</label>
                    <div className="d-flex gap-2">
                      <input type="number" className="form-control" style={{ width: 100 }} min={1} value={selectedServiceQty} onChange={(e) => setSelectedServiceQty(Number(e.target.value || 1))} />
                      <button type="button" className="btn btn-primary" onClick={addSelectedService}>
                        Add
                      </button>
                    </div>
                  </Col>
                </Row>

                {form.booking_services && form.booking_services.filter((b) => b.service_id && b.service_id > 0).length > 0 && (
                  <div className="mt-3">
                    {!servicesLoadedForEdit ? (
                      <div className="py-3 d-flex align-items-center gap-2">
                        <Spinner size="sm" animation="border" /> <small>Loading selected services...</small>
                      </div>
                    ) : (
                      <Table bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th style={{ width: 160 }}>Quantity</th>
                            <th style={{ width: 140 }}>Unit Price</th>
                            <th style={{ width: 140 }}>Amount</th>
                            <th style={{ width: 100 }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.booking_services
                            .filter((b) => b.service_id && b.service_id > 0)
                            .map((b) => {
                              const meta = servicesCache[b.service_id] || { name: `Service ${b.service_id}`, price: 0 };
                              const amount = (meta.price || 0) * (b.quantity || 0);
                              return (
                                <tr key={b.service_id}>
                                  <td className="align-middle">{meta.name}</td>
                                  <td>
                                    <input type="number" className="form-control" style={{ width: 140 }} min={0} value={b.quantity} onChange={(e) => updateServiceQuantity(b.service_id, Number(e.target.value || 0))} />
                                  </td>
                                  <td className="align-middle">₦{(meta.price || 0).toLocaleString()}</td>
                                  <td className="align-middle">₦{amount.toLocaleString()}</td>
                                  <td className="align-middle">
                                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveService(b.service_id)}>
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </Table>
                    )}
                  </div>
                )}
              </Form.Group>

              {/* Total Card */}
              <Card className="border-0 bg-light p-3 mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <div className="text-muted">Hall price</div>
                  <div className="fw-semibold">₦{hallPrice.toLocaleString()}</div>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <div className="text-muted">Participants total</div>
                  <div className="fw-semibold">₦{participantsTotal.toLocaleString()}</div>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <div className="text-muted">Services total</div>
                  <div className="fw-semibold">₦{servicesTotal.toLocaleString()}</div>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-1">
                  <div className="text-muted">Subtotal</div>
                  <div className="fw-semibold">₦{subtotal.toLocaleString()}</div>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <div className="text-muted">VAT ({(vatRate * 100).toFixed(1)}%)</div>
                  <div className="fw-semibold">₦{vatAmount.toLocaleString()}</div>
                </div>
                <hr />
                <div className="d-flex justify-content-between">
                  <div className="fw-semibold">Total Payable</div>
                  <div className="fw-bold text-primary">₦{grandTotal.toLocaleString()}</div>
                </div>
              </Card>

              <div className="text-center mt-2">
                <Button type="submit" className="btn btn-warning d-flex align-items-center gap-2 text-nowrap px-4 py-2 fw-semibold mx-auto" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      {"Submitting..."}
                    </>
                  ) : (
                    "Submit Booking"
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
