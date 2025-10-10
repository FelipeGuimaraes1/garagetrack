import { HeroAndFeatures } from "@/app/components/home/HeroAndFeatures";
import { getSession } from "@/lib/auth/auth";

export default async function HomePage() {
  const session = await getSession();
  const isLogged = Boolean(session?.user);

  return (
    <section className="space-y-8">
      <HeroAndFeatures isLogged={isLogged} />
    </section>
  );
}
