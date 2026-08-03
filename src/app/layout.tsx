import type { Metadata } from "next";
import { Archivo, Azeret_Mono, Kanit } from "next/font/google";
import "./globals.css";

/* Kanit — Cadson Demak, Bangkok. Its Latin derives from loopless Thai
   letterforms, which is what gives the heavy weights their squared poster
   punch. See DESIGN.md § Typography. */
const kanit = Kanit({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  display: "swap",
  variable: "--font-kanit",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-archivo",
});

const azeretMono = Azeret_Mono({
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
  variable: "--font-azeret-mono",
});

export const metadata: Metadata = {
  title: "Satasuk Viparksinlapin — Senior Software Engineer, AI Solutionist",
  description:
    "Senior Full stack engineer and AI solutionist in Bangkok, available remote. Backend systems, retrieval and agent tooling — before that, the quest engine inside a platform that served 100k+ players.",
  openGraph: {
    title: "Satasuk Viparksinlapin — Senior Software Engineer, AI Solutionist",
    description:
      "Backend systems, retrieval and agent tooling. A quest engine owned end to end, and what broke along the way.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${kanit.variable} ${archivo.variable} ${azeretMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
