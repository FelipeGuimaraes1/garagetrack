"use client";

import { useEffect } from "react";

/**
 * Mantém o foco dentro do contêiner enquanto `active` for true.
 * - Foca o primeiro elemento focável ao abrir.
 * - Cicla o Tab/Shift+Tab entre os focáveis.
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean
) {
  useEffect(() => {
    if (!active) return;

    const maybeEl = containerRef.current;
    if (!maybeEl) return;

    // A partir daqui usamos uma referência NON-NULL
    const root: HTMLElement = maybeEl;

    // Foca o primeiro elemento focável
    const focusables = getFocusable(root);
    if (focusables[0]) (focusables[0] as HTMLElement).focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      const els = getFocusable(root);
      if (!els.length) return;

      const first = els[0] as HTMLElement;
      const last = els[els.length - 1] as HTMLElement;
      const activeEl = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (activeEl === first || !root.contains(activeEl)) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (activeEl === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [containerRef, active]);
}

function getFocusable(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      [
        "a[href]",
        "button:not([disabled])",
        "textarea:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
      ].join(",")
    )
  ).filter((el) => !el.hasAttribute("disabled") && isVisible(el));
}

function isVisible(el: HTMLElement) {
  const style = window.getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden";
}
