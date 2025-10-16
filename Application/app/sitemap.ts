import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // 검색엔진에 URL을 제공하지 않음(빈 사이트맵)
  return [];
}
