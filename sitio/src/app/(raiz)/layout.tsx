import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import type { ReactNode } from "react";
import "../globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });

export const metadata: Metadata = {
  title: "Atias",
  description: "Atias · Cuenta la cosecha antes de recogerla.",
  icons: { icon: "/marca.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
