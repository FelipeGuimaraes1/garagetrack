"use client";

import { useExpenses } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/useToast";
import { UploadedAttachment } from "@/hooks/useUpload";
import { useVehicles } from "@/hooks/useVehicles";
import {
  maskCurrencyBRL,
  maskLiters2,
  maskPricePerLiter2,
  unmaskCurrencyBRL,
} from "@/lib/utils/mask-br";
import { useEffect, useMemo, useState } from "react";
import { ReceiptUploader } from "./ReceiptUploader";

type Props = {
  open: boolean;
  onClose: () => void;
};

const types = [
  "ABASTECIMENTO",
  "MANUTENCAO",
  "IMPOSTO",
  "SEGURO",
  "MULTA",
  "OUTRO",
] as const;
const fuelTypes = ["GASOLINA", "ETANOL", "DIESEL", "GNV"] as const;

export function ExpenseCreateModal({ open, onClose }: Props) {
  const { vehicles } = useVehicles();
  const { createExpense, reload } = useExpenses();
  const { showToast } = useToast();

  // Campos básicos
  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState<(typeof types)[number]>("ABASTECIMENTO");
  const [status, setStatus] = useState<"PAGO" | "PENDENTE">("PENDENTE");
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [amountMasked, setAmountMasked] = useState("");
  const [description, setDescription] = useState("");
  const [km, setKm] = useState("");

  // Abastecimento
  const [fuelLitersMasked, setFuelLitersMasked] = useState("");
  const [pricePerLiterMasked, setPricePerLiterMasked] = useState("");
  const [fuelType, setFuelType] = useState<string>("");
  const [station, setStation] = useState("");

  // Anexos
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);

  useEffect(() => {
    if (vehicles.length && !vehicleId) {
      setVehicleId(vehicles[0].id);
    }
  }, [vehicles]); // eslint-disable-line

  const isAbastecimento = useMemo(() => type === "ABASTECIMENTO", [type]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const payload: any = {
        vehicleId,
        type,
        status,
        date,
        amount: unmaskCurrencyBRL(amountMasked),
        description,
        km: km ? Number(km) : null,
      };

      if (isAbastecimento) {
        payload.fuelLiters = Number(
          fuelLitersMasked.replace(".", "").replace(",", ".")
        ); // "12,34" -> 12.34
        payload.pricePerLiter = Number(
          pricePerLiterMasked.replace(".", "").replace(",", ".")
        );
        payload.fuelType = fuelType || null;
        payload.station = station || null;
      }

      if (attachments.length) {
        payload.attachments = attachments.map((a) => ({
          url: a.url,
          contentType: a.contentType,
          size: a.size,
        }));
      }

      await createExpense(payload);
      showToast("Despesa criada com sucesso!", "success");
      await reload();
      onClose();
      // limpa
      setAmountMasked("");
      setDescription("");
      setKm("");
      setFuelLitersMasked("");
      setPricePerLiterMasked("");
      setFuelType("");
      setStation("");
      setAttachments([]);
    } catch (err: any) {
      showToast(err.message || "Erro ao criar despesa.", "error");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="panel w-full max-w-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Nova despesa</h2>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-lg border border-[var(--border)] text-sm hover:ring-1 hover:ring-white/5"
          >
            Fechar
          </button>
        </div>

        <form className="grid gap-3" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm mb-1">Veículo</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nickname || v.plate || "Sem apelido"}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
              >
                <option value="PENDENTE">PENDENTE</option>
                <option value="PAGO">PAGO</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Valor</label>
              <input
                inputMode="numeric"
                value={amountMasked}
                onChange={(e) =>
                  setAmountMasked(maskCurrencyBRL(e.target.value))
                }
                placeholder="R$ 0,00"
                className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Descrição</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex.: Troca de óleo"
              className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Hodômetro (km)</label>
            <input
              inputMode="numeric"
              value={km}
              onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
              placeholder="Ex.: 80010"
            />
          </div>

          {isAbastecimento && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Litros</label>
                <input
                  inputMode="numeric"
                  value={fuelLitersMasked}
                  onChange={(e) =>
                    setFuelLitersMasked(maskLiters2(e.target.value))
                  }
                  placeholder="0,00"
                  className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Preço/L</label>
                <input
                  inputMode="numeric"
                  value={pricePerLiterMasked}
                  onChange={(e) =>
                    setPricePerLiterMasked(maskPricePerLiter2(e.target.value))
                  }
                  placeholder="0,00"
                  className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Combustível</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
                >
                  <option value="">Selecione</option>
                  {fuelTypes.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Posto</label>
                <input
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                  placeholder="Ex.: Posto Centro"
                  className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
                />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <ReceiptUploader
              onAdd={(a) => setAttachments((prev) => [...prev, a])}
            />
            {attachments.length ? (
              <div className="text-sm text-[var(--muted)]">
                {attachments.length} anexo(s) pronto(s) para enviar.
              </div>
            ) : null}
          </div>

          <div className="pt-2 flex justify-end gap-2">
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
