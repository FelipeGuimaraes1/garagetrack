// "use client";

// import { BarChart } from "@/components/dashboard/BarChart";
// import { LineChart } from "@/components/dashboard/LineChart";
// import { SummaryCards } from "@/components/dashboard/SummaryCards";
// import { useToast } from "@/hooks/useToast";
// import { useVehicles } from "@/hooks/useVehicles";
// import { useEffect, useState } from "react";

// type ApiData = {
//   monthISO: string;
//   totalThisMonth: number;
//   totalPrevMonth: number;
//   avgTicketThisMonth: number;
//   countThisMonth: number;
//   byVehicle: Array<{ vehicleId: string; label: string; total: number }>;
//   lastMonths: Array<{ monthISO: string; total: number }>;
// };

// const EXPENSE_TYPES = [
//   "",
//   "ABASTECIMENTO",
//   "MANUTENCAO",
//   "IMPOSTO",
//   "SEGURO",
//   "MULTA",
//   "OUTRO",
// ] as const;

// export default function DashboardPage() {
//   const { showToast } = useToast();
//   const { vehicles } = useVehicles(); // para popular <select> de veículos

//   // filtros
//   const [month, setMonth] = useState<string>(() =>
//     new Date().toISOString().slice(0, 7)
//   );
//   const [vehicleId, setVehicleId] = useState<string>("");
//   const [type, setType] = useState<string>("");

//   // dados
//   const [data, setData] = useState<ApiData | null>(null);
//   const [loading, setLoading] = useState(true);

//   async function load(m: string, v: string, t: string) {
//     try {
//       setLoading(true);
//       const qs = new URLSearchParams();
//       qs.set("month", m);
//       if (v) qs.set("vehicleId", v);
//       if (t) qs.set("type", t);
//       const res = await fetch(`/api/analytics?${qs.toString()}`, {
//         cache: "no-store",
//       });
//       if (!res.ok) throw new Error("Falha ao carregar os dados.");
//       const json: ApiData = await res.json();
//       setData(json);
//     } catch (e: any) {
//       showToast(e.message || "Falha ao carregar dashboard", "error");
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     void load(month, vehicleId, type);
//   }, [month, vehicleId, type]);

//   function addMonths(ym: string, delta: number) {
//     const [y, m] = ym.split("-").map((n) => parseInt(n, 10));
//     const d = new Date(y, m - 1 + delta, 1);
//     return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
//   }

//   return (
//     <div className="grid gap-4">
//       <Header
//         month={month}
//         onChangeMonth={setMonth}
//         onPrev={() => setMonth((m) => addMonths(m, -1))}
//         onNext={() => setMonth((m) => addMonths(m, +1))}
//         vehicleId={vehicleId}
//         onChangeVehicle={setVehicleId}
//         type={type}
//         onChangeType={setType}
//         vehiclesOptions={vehicles}
//       />

//       {loading && <div className="surface p-4">Carregando dashboard...</div>}
//       {!loading && !data && (
//         <div className="surface p-4">Sem dados para exibir.</div>
//       )}

//       {!loading && data && (
//         <>
//           <SummaryCards
//             totalThisMonth={data.totalThisMonth}
//             totalPrevMonth={data.totalPrevMonth}
//             avgTicketThisMonth={data.avgTicketThisMonth}
//             countThisMonth={data.countThisMonth}
//           />
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//             <BarChart
//               title={`Gasto por veículo (${data.monthISO})`}
//               data={data.byVehicle.map((x) => ({
//                 label: x.label,
//                 value: x.total,
//               }))}
//             />
//             <LineChart
//               title="Gasto nos últimos 6 meses"
//               data={data.lastMonths.map((m) => ({
//                 label: m.monthISO,
//                 value: m.total,
//               }))}
//             />
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// function Header({
//   month,
//   onChangeMonth,
//   onPrev,
//   onNext,
//   vehicleId,
//   onChangeVehicle,
//   type,
//   onChangeType,
//   vehiclesOptions,
// }: {
//   month: string;
//   onChangeMonth: (m: string) => void;
//   onPrev: () => void;
//   onNext: () => void;
//   vehicleId: string;
//   onChangeVehicle: (v: string) => void;
//   type: string;
//   onChangeType: (t: string) => void;
//   vehiclesOptions: Array<{
//     id: string;
//     nickname: string | null;
//     plate: string | null;
//   }>;
// }) {
//   return (
//     <div className="surface p-4 grid gap-3 sm:flex sm:items-center sm:justify-between">
//       <h1 className="text-xl font-semibold">Dashboard</h1>
//       <div className="flex flex-wrap items-center gap-2">
//         <button
//           onClick={onPrev}
//           className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
//           title="Mês anterior"
//         >
//           «
//         </button>

//         <label className="sr-only" htmlFor="month-input">
//           Selecione o mês
//         </label>
//         <input
//           id="month-input"
//           type="month"
//           value={month}
//           onChange={(e) => onChangeMonth(e.target.value)}
//           className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:ring-1 focus:ring-white/10"
//         />

//         <button
//           onClick={onNext}
//           className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
//           title="Próximo mês"
//         >
//           »
//         </button>

//         <select
//           value={vehicleId}
//           onChange={(e) => onChangeVehicle(e.target.value)}
//           className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
//           title="Filtrar por veículo"
//         >
//           <option value="">Todos os veículos</option>
//           {vehiclesOptions.map((v) => (
//             <option key={v.id} value={v.id}>
//               {v.nickname || v.plate || "Veículo"}
//             </option>
//           ))}
//         </select>

//         <select
//           value={type}
//           onChange={(e) => onChangeType(e.target.value)}
//           className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
//           title="Filtrar por tipo"
//         >
//           {EXPENSE_TYPES.map((t) => (
//             <option key={t || "ALL"} value={t}>
//               {t ? t : "Todos os tipos"}
//             </option>
//           ))}
//         </select>
//       </div>
//     </div>
//   );
// }

"use client";

import { BarChart } from "@/components/dashboard/BarChart";
import { LineChart } from "@/components/dashboard/LineChart";
import { RemindersCard } from "@/components/dashboard/RemindersCard";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { useToast } from "@/hooks/useToast";
import { useVehicles } from "@/hooks/useVehicles";
import { useEffect, useState } from "react";

type ApiData = {
  monthISO: string;
  totalThisMonth: number;
  totalPrevMonth: number;
  avgTicketThisMonth: number;
  countThisMonth: number;
  byVehicle: Array<{ vehicleId: string; label: string; total: number }>;
  lastMonths: Array<{ monthISO: string; total: number }>;
};

const EXPENSE_TYPES = [
  "",
  "ABASTECIMENTO",
  "MANUTENCAO",
  "IMPOSTO",
  "SEGURO",
  "MULTA",
  "OUTRO",
] as const;

export default function DashboardPage() {
  const { showToast } = useToast();
  const { vehicles } = useVehicles();

  const [month, setMonth] = useState<string>(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [vehicleId, setVehicleId] = useState<string>("");
  const [type, setType] = useState<string>("");

  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(m: string, v: string, t: string) {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      qs.set("month", m);
      if (v) qs.set("vehicleId", v);
      if (t) qs.set("type", t);
      const res = await fetch(`/api/analytics?${qs.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Falha ao carregar os dados.");
      const json: ApiData = await res.json();
      setData(json);
    } catch (e: any) {
      showToast(e.message || "Falha ao carregar dashboard", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(month, vehicleId, type);
  }, [month, vehicleId, type]);

  function addMonths(ym: string, delta: number) {
    const [y, m] = ym.split("-").map((n) => parseInt(n, 10));
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  return (
    <div className="grid gap-4">
      {/* Header com filtros (mesmo que você já tinha) */}
      <div className="surface p-4 grid gap-3 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setMonth((m) => addMonths(m, -1))}
            className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
            title="Mês anterior"
          >
            «
          </button>
          <input
            id="month-input"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:ring-1 focus:ring-white/10"
          />
          <button
            onClick={() => setMonth((m) => addMonths(m, +1))}
            className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
            title="Próximo mês"
          >
            »
          </button>

          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
            title="Filtrar por veículo"
          >
            <option value="">Todos os veículos</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nickname || v.plate || "Veículo"}
              </option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
            title="Filtrar por tipo"
          >
            {EXPENSE_TYPES.map((t) => (
              <option key={t || "ALL"} value={t}>
                {t ? t : "Todos os tipos"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="surface p-4">Carregando dashboard...</div>}
      {!loading && !data && (
        <div className="surface p-4">Sem dados para exibir.</div>
      )}

      {!loading && data && (
        <>
          <SummaryCards
            totalThisMonth={data.totalThisMonth}
            totalPrevMonth={data.totalPrevMonth}
            avgTicketThisMonth={data.avgTicketThisMonth}
            countThisMonth={data.countThisMonth}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BarChart
                title={`Gasto por veículo (${data.monthISO})`}
                data={data.byVehicle.map((x) => ({
                  label: x.label,
                  value: x.total,
                }))}
              />
              <LineChart
                title="Gasto nos últimos 6 meses"
                data={data.lastMonths.map((m) => ({
                  label: m.monthISO,
                  value: m.total,
                }))}
              />
            </div>

            {/* Card novo */}
            <RemindersCard />
          </div>
        </>
      )}
    </div>
  );
}
