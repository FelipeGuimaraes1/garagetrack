import { AppShell } from "@/components/layout/AppShell";
import { getSession } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/signin");
  }

  return <AppShell>{children}</AppShell>;
}
