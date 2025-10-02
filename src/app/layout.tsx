// import { PageShell } from "@/components/PageShell";
// import { ReminderWatcher } from "@/components/reminders/ReminderWatcher";
// import { ToastProvider } from "@/components/ui/ToastProvider";
// import type { Metadata } from "next";
// import "./globals.css";

// export const metadata: Metadata = {
//   title: "GarageTrack",
//   description: "Controle seus veículos e despesas com facilidade.",
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="pt-BR">
//       <body>
//         <ToastProvider>
//           <PageShell>{children}</PageShell>
//           <ReminderWatcher />
//         </ToastProvider>
//       </body>
//     </html>
//   );
// }
import { AppProviders } from "@/components/common/AppProviders";
import { Sidebar } from "@/components/layout/Sidebar"; // se você usa um layout próprio, importe aqui
import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "GarageTrack",
  description: "Controle de veículos e despesas",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProviders>
          {/* Se você tem um layout de página, coloque-o aqui.
             Ex.: <SidebarLayout>{children}</SidebarLayout> */}
          <div className="flex">
            <Sidebar />
            <main className="flex-1 min-h-dvh p-4">{children}</main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
