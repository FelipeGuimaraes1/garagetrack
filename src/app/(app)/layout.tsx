import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh grid grid-cols-[auto_1fr]">
      <Sidebar />
      <main className="p-4">{children}</main>
    </div>
  );
}
