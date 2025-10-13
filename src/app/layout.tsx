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
  manifest: "/site.webmanifest",
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
      { url: "/og-image.png", width: 1200, height: 630, alt: "GarageTrack" },
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
};

export const viewport: Viewport = {
  // cor da barra do Safari (combina com seu fundo escuro)
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b0f14" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f14" },
  ],
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      {/* usamos 100dvh via CSS e safe-area paddings no globals.css */}
      <body className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
