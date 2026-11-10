import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

// La misma tipografía que la web pública; el eje de anchura da el logotipo condensado.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });

export const metadata: Metadata = {
  title: "Atias",
  description: "Kilos previstos y temporeros necesarios para la recolección.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={archivo.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}
