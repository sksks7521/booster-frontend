import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";
import AppShell from "@/components/layout/AppShell";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://booster-frontend.vercel.app";
const isPreview =
  process.env.NEXT_PUBLIC_ENV === "preview" ||
  process.env.VERCEL_ENV === "preview";

export const metadata: Metadata = {
  title: {
    default: "부동산부스터",
    template: "%s | 부동산부스터",
  },
  description: "데이터 기반으로 부동산 분석을 더 빠르고 정확하게.",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "부동산부스터",
    title: "부동산부스터",
    description: "데이터 기반 부동산 분석 플랫폼",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "부동산부스터",
    description: "데이터 기반 부동산 분석 플랫폼",
    images: ["/og.png"],
  },
  robots: isPreview
    ? { index: false, follow: false }
    : { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 개발 모드에서만 MSW 구동
  if (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_ENABLE_MSW === "true"
  ) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    import("../mocks/browser").then(({ worker }) => {
      void worker.start({ serviceWorker: { url: "/mockServiceWorker.js" } });
    });
  }
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
