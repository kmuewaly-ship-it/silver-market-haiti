import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { ...toast, id, duration: toast.duration || 3000 };

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message?: string) =>
      addToast({ title, message, type: "success" }),
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string) =>
      addToast({ title, message, type: "error" }),
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string) =>
      addToast({ title, message, type: "info" }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string) =>
      addToast({ title, message, type: "warning" }),
    [addToast]
  );

  return { toasts, addToast, removeToast, success, error, info, warning };
};
