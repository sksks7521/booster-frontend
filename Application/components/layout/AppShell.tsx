"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password";
  return (
    <>
      {!isAuthRoute && <Header />}
      {children}
    </>
  );
}
