export default function HomePage() {
  return (
    <section className="space-y-4">
      <div className="panel p-4">
        <h1 className="text-xl font-semibold">Bem-vindo ao GarageTrack</h1>
        <p className="text-[var(--muted)]">
          Gerencie seus veículos, registre despesas e anexe notas fiscais com
          facilidade.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="surface p-4">
          <h2 className="font-medium">Veículos</h2>
          <p className="text-sm text-[var(--muted)]">
            Cadastre os veículos e acompanhe quilometragem e combustível.
          </p>
        </div>
        <div className="surface p-4">
          <h2 className="font-medium">Despesas</h2>
          <p className="text-sm text-[var(--muted)]">
            Registre abastecimentos, manutenções e mais, com anexos.
          </p>
        </div>
      </div>
    </section>
  );
}
