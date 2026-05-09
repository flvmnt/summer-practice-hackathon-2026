import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";

const displayFont = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = Inter_Tight({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ShowUp2Move",
    template: "%s | ShowUp2Move",
  },
  description: "Smart social sports matching for spontaneous local games.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF7F0",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      data-brand="B"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
