"use client";

import { useToastContext } from "@/components/ui/ToastProvider";

export type ToastType = "success" | "error" | "warning" | "info";

export function useToast() {
  const { showToast } = useToastContext();
  return { showToast };
}
