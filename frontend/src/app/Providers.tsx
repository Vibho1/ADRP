"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  // Clean potential quotes or trailing slashes from env input
  const rawUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_NEXTAUTH_URL || "";
  const cleanUrl = rawUrl.replace(/["']/g, "").replace(/\/$/, "").trim();

  return (
    <SessionProvider baseUrl={cleanUrl || undefined}>
      {children}
    </SessionProvider>
  );
}