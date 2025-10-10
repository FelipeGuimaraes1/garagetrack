"use client";

import Link from "next/link";
import { useState } from "react";

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M13 5l7 7-7 7v-4H4v-6h9V5z" />
    </svg>
  );
}
function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 22a2.5 2.5 0 0 1-2.45-2h4.9A2.5 2.5 0 0 1 12 22Zm8-6V11a8 8 0 1 0-16 0v5l-2 2v1h20v-1l-2-2Z"
      />
    </svg>
  );
}
function CarIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M5 11h14l-1.2-3.6A3 3 0 0 0 15 5H9a3 3 0 0 0-2.8 2.4L5 11Zm-1 2v5h2v-2h12v2h2v-5H4Zm3.5 1.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
      />
    </svg>
  );
}
function ReceiptIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 2h10a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V4a2 2 0 0 1 2-2Zm2 5h6v2H9V7Zm0 4h6v2H9v-2Z"
      />
    </svg>
  );
}

export function HeroAndFeatures({ isLogged }: { isLogged: boolean }) {
  // começa aberto se já estiver logado; fechado se anônimo
  const [showFeatures, setShowFeatures] = useState(() => isLogged);

  return (
    <>
      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[rgba(255,255,255,0.02)] to-[rgba(255,255,255,0.01)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_60%)] blur-2xl"
        />
        <div className="p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-semibold">
            Bem-vindo ao GarageTrack
          </h1>
          <p className="mt-2 text-[var(--muted)] max-w-3xl">
            Gerencie seus veículos, registre despesas (com anexos) e receba
            lembretes inteligentes de manutenção — tudo em um só lugar.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {!isLogged ? (
              <>
                <Link href="/signin" className="button-primary">
                  Entrar
                </Link>
                <button
                  type="button"
                  onClick={() => setShowFeatures((v) => !v)}
                  aria-expanded={showFeatures}
                  aria-controls="features-section"
                  className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
                >
                  {showFeatures ? "Ocultar" : "Como funciona"}
                </button>
              </>
            ) : (
              <>
                <Link href="/vehicles" className="button-primary">
                  Abrir GarageTrack
                </Link>
                <Link
                  href="/expenses"
                  className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
                >
                  Adicionar despesa
                </Link>
                <button
                  type="button"
                  onClick={() => setShowFeatures((v) => !v)}
                  aria-expanded={showFeatures}
                  aria-controls="features-section"
                  className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
                >
                  {showFeatures ? "Ocultar" : "Como funciona"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* FEATURES — controla 100% pela flag showFeatures */}
      <div
        id="features-section"
        className={`transition-[max-height,opacity] duration-300 ${
          showFeatures
            ? "max-h-[1000px] opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <article className="surface rounded-xl p-4 border border-[var(--border)] hover:border-white/20 hover:bg-white/5 transition-colors">
            <div className="flex items-start gap-3">
              <span className="shrink-0 grid h-9 w-9 place-items-center rounded-lg border border-[var(--border)] bg-white/5">
                <CarIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-medium">Controle de veículos</h3>
                <p className="text-sm text-[var(--muted)]">
                  Cadastre apelido, placa e hodômetro. Acompanhe tudo com
                  precisão.
                </p>
              </div>
            </div>
          </article>

          <article className="surface rounded-xl p-4 border border-[var(--border)] hover:border-white/20 hover:bg-white/5 transition-colors">
            <div className="flex items-start gap-3">
              <span className="shrink-0 grid h-9 w-9 place-items-center rounded-lg border border-[var(--border)] bg-white/5">
                <ReceiptIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-medium">Despesas com anexos</h3>
                <p className="text-sm text-[var(--muted)]">
                  Registre abastecimentos e manutenções e anexe notas/fotos.
                </p>
              </div>
            </div>
          </article>

          <article className="surface rounded-xl p-4 border border-[var(--border)] hover:border-white/20 hover:bg-white/5 transition-colors">
            <div className="flex items-start gap-3">
              <span className="shrink-0 grid h-9 w-9 place-items-center rounded-lg border border-[var(--border)] bg-white/5">
                <BellIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-medium">Lembretes inteligentes</h3>
                <p className="text-sm text-[var(--muted)]">
                  Avise por quilômetros ou data, com alerta antecipado.
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* QUICK LINKS (inalterado) */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/vehicles"
          className="group block focus:outline-none rounded-xl"
          aria-label="Ir para a página de veículos"
        >
          <article
            className="surface p-4 rounded-xl border border-[var(--border)]
                       hover:border-white/20 hover:bg-white/5 transition-all
                       focus-visible:ring-2 focus-visible:ring-white/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-medium">Veículos</h2>
                <p className="text-sm text-[var(--muted)]">
                  Cadastre os veículos e acompanhe quilometragem e combustível.
                  {!isLogged && " (você precisará entrar)"}
                </p>
              </div>
              <span
                className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full
                           border border-[var(--border)] bg-white/5
                           transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >
                <ArrowIcon className="w-4 h-4" />
              </span>
            </div>
          </article>
        </Link>

        <Link
          href="/expenses"
          className="group block focus:outline-none rounded-xl"
          aria-label="Ir para a página de despesas"
        >
          <article
            className="surface p-4 rounded-xl border border-[var(--border)]
                       hover:border-white/20 hover:bg-white/5 transition-all
                       focus-visible:ring-2 focus-visible:ring-white/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-medium">Despesas</h2>
                <p className="text-sm text-[var(--muted)]">
                  Registre abastecimentos, manutenções e mais, com anexos.
                  {!isLogged && " (você precisará entrar)"}
                </p>
              </div>
              <span
                className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full
                           border border-[var(--border)] bg-white/5
                           transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >
                <ArrowIcon className="w-4 h-4" />
              </span>
            </div>
          </article>
        </Link>
      </div>
    </>
  );
}
