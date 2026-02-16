import { toast, Id } from "react-toastify";

type ToastKey = string;

const lastShown: Record<ToastKey, number> = {};
const toastIds: Record<ToastKey, Id | null> = {};
const THROTTLE_MS = 5000; // suppress duplicate toasts for 5s per key

export function showSingleToast(message: string, key: ToastKey = "default", options: Record<string, unknown> = {}) {
  const now = Date.now();
  if (lastShown[key] && now - lastShown[key] < THROTTLE_MS) {
    // Update the existing toast content if still active
    const existingId = toastIds[key];
    if (existingId && toast.isActive(existingId)) {
      toast.update(existingId, { render: message });
    }
    return existingId ?? null;
  }

  lastShown[key] = now;
  const id = toast.error(message, {
    ...options,
    onClose: () => {
      // clear stored id when closed
      toastIds[key] = null;
    },
  });
  toastIds[key] = id;
  return id;
}

export function clearSingleToast(key: ToastKey = "default") {
  const id = toastIds[key];
  if (id && toast.isActive(id)) toast.dismiss(id);
  toastIds[key] = null;
  delete lastShown[key];
}

export default showSingleToast;
