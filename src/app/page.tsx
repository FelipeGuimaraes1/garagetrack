import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-4">
      <div className="panel p-4">
        <h1 className="text-xl font-semibold">Bem-vindo ao GarageTrack</h1>
        <p className="text-[var(--muted)]">
          Gerencie seus veículos, registre despesas e anexe notas fiscais dos
          serviços, tudo com facilidade.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Card-link: Veículos */}
        <Link
          href="/vehicles"
          className="group block focus:outline-none rounded-xl"
          aria-label="Ir para a página de veículos"
        >
          <article
            className="surface p-4 rounded-xl border border-[var(--border)]
                       hover:border-white/20 hover:bg-white/5 transition-colors
                       focus-visible:ring-2 focus-visible:ring-white/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-medium">Veículos</h2>
                <p className="text-sm text-[var(--muted)]">
                  Cadastre os veículos e acompanhe quilometragem e combustível.
                </p>
              </div>

              {/* Indicador visual de ação */}
              <span
                className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full
                           border border-[var(--border)] bg-white/5
                           transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="currentColor" d="M13 5l7 7-7 7v-4H4v-6h9V5z" />
                </svg>
              </span>
            </div>
          </article>
        </Link>

        {/* Card-link: Despesas */}
        <Link
          href="/expenses"
          className="group block focus:outline-none rounded-xl"
          aria-label="Ir para a página de despesas"
        >
          <article
            className="surface p-4 rounded-xl border border-[var(--border)]
                       hover:border-white/20 hover:bg-white/5 transition-colors
                       focus-visible:ring-2 focus-visible:ring-white/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-medium">Despesas</h2>
                <p className="text-sm text-[var(--muted)]">
                  Registre abastecimentos, manutenções e mais, com anexos.
                </p>
              </div>

              <span
                className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full
                           border border-[var(--border)] bg-white/5
                           transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="currentColor" d="M13 5l7 7-7 7v-4H4v-6h9V5z" />
                </svg>
              </span>
            </div>
          </article>
        </Link>
      </div>
    </section>
  );
}
