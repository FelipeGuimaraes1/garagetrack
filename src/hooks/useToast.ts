export type ToastType = "success" | "error" | "warning" | "info";

export function useToast() {
  function showToast(message: string, type: ToastType = "info") {
    // Placeholder: use alert por enquanto. Trocaremos por UI bacana depois.
    const prefix = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" }[
      type
    ];
    alert(`${prefix} ${message}`);
  }
  return { showToast };
}
