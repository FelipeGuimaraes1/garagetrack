"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Item = {
  id: string;
  title: string;
  type: string;
  vehicleLabel: string | null;
  hint: string;
};

export function RemindersCard() {
  const [data, setData] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch("/api/reminders/upcoming", { cache: "no-store" });
      const json = await res.json();
      setData(json);
      setLoading(false);
    };
    void load();
  }, []);

  return (
    <div className="surface p-4 rounded-xl border border-[var(--border)]">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Próximos lembretes</h3>
        <Link
          href="/reminders"
          className="text-sm text-[var(--muted)] hover:underline"
        >
          ver todos
        </Link>
      </div>

      {loading && (
        <div className="text-sm text-[var(--muted)] mt-3">Carregando...</div>
      )}
      {!loading && (!data || data.length === 0) && (
        <div className="text-sm text-[var(--muted)] mt-3">
          Nenhum lembrete pendente.
        </div>
      )}

      <ul className="mt-3 grid gap-2">
        {data?.map((r) => (
          <li
            key={r.id}
            className="flex items-start justify-between gap-2 rounded-lg px-3 py-2 border border-[var(--border)] bg-white/5"
          >
            <div className="min-w-0">
              <div className="font-medium truncate">{r.title}</div>
              <div className="text-xs text-[var(--muted)] truncate">
                {r.type}
                {r.vehicleLabel ? ` · ${r.vehicleLabel}` : ""}
              </div>
            </div>
            <div className="text-sm shrink-0">{r.hint}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
