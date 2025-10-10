import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
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
