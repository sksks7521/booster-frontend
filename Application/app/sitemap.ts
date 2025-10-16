import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://booster-frontend.vercel.app";
  const lastModified = new Date();

  const urls = ["", "/analysis", "/pricing", "/login", "/checkout"];

  return urls.map((path) => ({
    url: new URL(path, base).toString(),
    lastModified,
  }));
}
