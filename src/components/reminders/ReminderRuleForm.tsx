"use client";

import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useVehicles } from "@/hooks/useVehicles";
import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void> | void;
  defaultValues?: any;
};

const TYPES = ["OIL_CHANGE", "SERVICE", "DOCUMENT", "FINE", "CUSTOM"] as const;

export function ReminderRuleForm({
  open,
  onClose,
  onSubmit,
  defaultValues,
}: Props) {
  const { vehicles } = useVehicles();

  const [userId, setUserId] = useState<string>("demo-user"); // placeholder: integrar com auth depois
  const [vehicleId, setVehicleId] = useState<string>("");
  const [type, setType] = useState<string>("OIL_CHANGE");
  const [title, setTitle] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [everyKm, setEveryKm] = useState<string>("");
  const [everyDays, setEveryDays] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");

  const [warnKmLeft, setWarnKmLeft] = useState<string>("500");
  const [warnDaysLeft, setWarnDaysLeft] = useState<string>("15");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!defaultValues) return;
    setVehicleId(defaultValues.vehicleId ?? "");
    setType(defaultValues.type ?? "OIL_CHANGE");
    setTitle(defaultValues.title ?? "");
    setNotes(defaultValues.notes ?? "");
    setEveryKm(defaultValues.everyKm?.toString() ?? "");
    setEveryDays(defaultValues.everyDays?.toString() ?? "");
    setDueDate(defaultValues.dueDate ? defaultValues.dueDate.slice(0, 10) : "");
    setWarnKmLeft(defaultValues.warnKmLeft?.toString() ?? "500");
    setWarnDaysLeft(defaultValues.warnDaysLeft?.toString() ?? "15");
    setIsActive(defaultValues.isActive ?? true);
  }, [defaultValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      userId,
      vehicleId: vehicleId || null,
      type,
      title,
      notes: notes || null,
      everyKm: everyKm ? Number(everyKm) : null,
      everyDays: everyDays ? Number(everyDays) : null,
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00`) : null,
      warnKmLeft: warnKmLeft ? Number(warnKmLeft) : 500,
      warnDaysLeft: warnDaysLeft ? Number(warnDaysLeft) : 15,
      isActive,
    };
    await onSubmit(payload);
    onClose();
  }

  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef as any, open);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center modal-overlay p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="modal-panel w-full max-w-lg max-h-[85dvh] overflow-y-auto"
      >
        <div className="p-4 sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] rounded-t-[1rem] flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {defaultValues ? "Editar lembrete" : "Novo lembrete"}
          </h2>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-lg border border-[var(--border)] text-sm hover:ring-1 hover:ring-white/5"
          >
            Fechar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 p-4 pt-3">
          <div>
            <label className="block text-sm mb-1">Tipo</label>
            <select
              className="w-full px-3 py-2"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Veículo</label>
            <select
              className="w-full px-3 py-2"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">Geral (sem veículo)</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nickname || v.plate || "Veículo"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Título</label>
            <input
              className="w-full px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Troca de óleo"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Observações</label>
            <input
              className="w-full px-3 py-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Cada X km</label>
              <input
                className="w-full px-3 py-2"
                inputMode="numeric"
                value={everyKm}
                onChange={(e) => setEveryKm(e.target.value.replace(/\D/g, ""))}
                placeholder="ex.: 10000"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Cada X dias</label>
              <input
                className="w-full px-3 py-2"
                inputMode="numeric"
                value={everyDays}
                onChange={(e) =>
                  setEveryDays(e.target.value.replace(/\D/g, ""))
                }
                placeholder="ex.: 180"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Data fixa</label>
              <input
                type="date"
                className="w-full px-3 py-2"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">
                Avisar quando faltar (km)
              </label>
              <input
                className="w-full px-3 py-2"
                inputMode="numeric"
                value={warnKmLeft}
                onChange={(e) =>
                  setWarnKmLeft(e.target.value.replace(/\D/g, ""))
                }
              />
            </div>
            <div>
              <label className="block text-sm mb-1">
                Avisar quando faltar (dias)
              </label>
              <input
                className="w-full px-3 py-2"
                inputMode="numeric"
                value={warnDaysLeft}
                onChange={(e) =>
                  setWarnDaysLeft(e.target.value.replace(/\D/g, ""))
                }
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className="text-sm">Ativo</span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 sticky bottom-0 bg-[var(--surface)] border-t border-[var(--border)] mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
            >
              Cancelar
            </button>
            <button type="submit" className="button-primary">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
