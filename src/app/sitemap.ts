import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://garagetrack.vercel.app";
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/vehicles`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/expenses`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
