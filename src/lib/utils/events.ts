"use client";

/** Micro event bus baseado em CustomEvent para sincronizar telas. */
export function emitAppEvent<T = unknown>(name: string, detail?: T) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<T>(name, { detail }));
}

export function onAppEvent<T = unknown>(
  name: string,
  handler: (detail: T) => void
) {
  const listener = (e: Event) => handler((e as CustomEvent<T>).detail);
  window.addEventListener(name, listener);
  return () => window.removeEventListener(name, listener);
}
