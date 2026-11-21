import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const orbitron = localFont({
  src: "./fonts/orbitron/orbitron-800.ttf",
  weight: "800",
  variable: "--font-orbitron",
  display: "swap",
});

const jetBrainsMono = localFont({
  src: [
    { path: "./fonts/jetbrains-mono/jetbrains-mono-400.ttf", weight: "400" },
    { path: "./fonts/jetbrains-mono/jetbrains-mono-700.ttf", weight: "700" },
  ],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Join the Nexus | NEONCORE",
  description: "Try the NEONCORE sign-up demo. No account is created.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${orbitron.variable} ${jetBrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
