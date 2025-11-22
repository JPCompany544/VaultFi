import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientProviders from "./ClientProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VaultFi Protocol",
  description: "A Solana-native multi-strategy, multi-asset vault infrastructure for smart yield routing",
  icons: {
    icon: [
      { url: "/vault-list-logos/vaultfi-logo.png", sizes: "32x32", type: "image/png" },
      { url: "/vault-list-logos/vaultfi-logo.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/vault-list-logos/vaultfi-logo.png",
    apple: "/vault-list-logos/vaultfi-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden box-border min-h-screen w-full`}
        suppressHydrationWarning
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
