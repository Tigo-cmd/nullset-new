import type { Metadata } from "next";
import { PT_Mono } from "next/font/google";
import "./globals.css";

const mono = PT_Mono({ weight: "400", variable: "--font-pt-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "tornado: private transfers",
  description:
    "An interactive simulation of a zero-knowledge privacy pool. No real wallets, funds or blockchain.",
  icons: {
    icon: "/tornado-mark.png",
    shortcut: "/tornado-mark.png",
    apple: "/tornado-mark.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${mono.variable} h-full`}>
      <body className="min-h-full font-sans text-ns-text antialiased">{children}</body>
    </html>
  );
}
