import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tempus | Decisiones Deterministas",
  description: "Infraestructura de decisiones deterministas y facturación.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <nav className="nav-container">
          <Link href="/" className="nav-logo">
            TEMPUS
          </Link>
          <div className="nav-links">
            <Link href="/builder">Configuración</Link>
            <Link href="/dashboard">Simulación</Link>
            <Link href="/audit">Auditoría</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
