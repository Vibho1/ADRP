"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  // Safe fallback to prevent ERR_INVALID_URL during build prerender
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : "http://localhost:3000");

  return (
    <SessionProvider baseUrl={baseUrl}>
      {children}
    </SessionProvider>
  );
}