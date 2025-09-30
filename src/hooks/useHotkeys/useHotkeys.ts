"use client";

import { useEffect } from "react";

/**
 * useHotkeys
 * Registra listeners de teclado e chama o handler quando a combinação bate.
 * Ex.: useHotkeys("c", (e) => { ... })
 */
export function useHotkeys(
  combo: string | string[],
  handler: (ev: KeyboardEvent) => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const combos = Array.isArray(combo) ? combo : [combo];

    function onKey(ev: KeyboardEvent) {
      // ignora quando está digitando em inputs/textarea/select/contenteditable
      const target = ev.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName?.toLowerCase();
        const editable =
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          target.isContentEditable;
        if (editable) return;
      }

      const key = ev.key.toLowerCase();
      if (combos.some((c) => c.toLowerCase() === key)) {
        handler(ev);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
