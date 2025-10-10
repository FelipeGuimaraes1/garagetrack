import { AppProviders } from "@/components/providers/AppProviders";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: {
    default: "GarageTrack",
    template: "%s — GarageTrack",
  },
  description:
    "Controle de veículos e despesas: abastecimentos, manutenções, lembretes e anexos.",
  applicationName: "GarageTrack",
  // 🔗 Manifest (coloquei em public/site.webmanifest)
  manifest: "/site.webmanifest",
  // 🔗 Ícones (mantém compatibilidade)
  icons: {
    icon: [{ url: "/favicon.svg?v=1", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png?v=1" }],
  },
  openGraph: {
    type: "website",
    siteName: "GarageTrack",
    title: "GarageTrack — Controle seus veículos e despesas",
    description:
      "Gerencie veículos, despesas e lembretes de manutenção com anexos e odômetro.",
    url: "/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GarageTrack",
      },
    ],
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "GarageTrack — Controle seus veículos e despesas",
    description:
      "Gerencie veículos, despesas e lembretes de manutenção com anexos e odômetro.",
    images: ["/og-image.png"],
  },
  // 👇 REMOVIDO DAQUI: themeColor (para acabar com o aviso)
};

export const viewport: Viewport = {
  // Agora o themeColor fica aqui
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0EA5E9" },
    { media: "(prefers-color-scheme: dark)", color: "#0EA5E9" },
  ],
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark", // você usa tema escuro por padrão
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-svh bg-[var(--background)] text-[var(--foreground)]">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
