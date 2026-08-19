import type { Metadata } from "next";
import { cookies } from "next/headers";
import { cookieToInitialState } from "wagmi";

import { AppKitProvider } from "@/components/providers/appkit-provider";
import { wagmiConfig } from "@/lib/chains";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Xecute",
  title: "Xecute · AI Execution & Intelligence Terminal on X Layer",
  description: "Prompt it. Preview it. Xecute it on X Layer.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = cookieToInitialState(wagmiConfig, (await cookies()).toString());

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <AppKitProvider initialState={initialState}>{children}</AppKitProvider>
      </body>
    </html>
  );
}
