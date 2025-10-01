import { PageShell } from "@/components/PageShell";
import { ReminderWatcher } from "@/components/reminders/ReminderWatcher";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GarageTrack",
  description: "Controle seus veículos e despesas com facilidade.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <PageShell>{children}</PageShell>
      </body>
      <ReminderWatcher />
    </html>
  );
}
