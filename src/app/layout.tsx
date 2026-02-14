import type { Metadata } from "next";
import { Zilla_Slab, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import "./globals.css";

const zillaSlab = Zilla_Slab({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-zilla-slab",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "E o Pix? | Consulta de Empresas e Pessoas",
    template: "%s | E o Pix?",
  },
  description:
    "Consulte informações públicas sobre empresas e pessoas antes de fechar negócio. Relatórios completos com análise de risco.",
  keywords: [
    "consulta cnpj",
    "consulta cpf",
    "análise de risco",
    "inadimplência",
    "due diligence",
  ],
  authors: [{ name: "E o Pix?" }],
  creator: "E o Pix?",
  publisher: "E o Pix?",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    title: "E o Pix? | Consulta de Empresas e Pessoas",
    description:
      "Consulte informações públicas sobre empresas e pessoas antes de fechar negócio.",
    siteName: "E o Pix?",
  },
  twitter: {
    card: "summary_large_image",
    title: "E o Pix? | Consulta de Empresas e Pessoas",
    description:
      "Consulte informações públicas sobre empresas e pessoas antes de fechar negócio.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Plausible Analytics (cookieless, LGPD compliant) */}
        <Script
          defer
          data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'localhost'}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${zillaSlab.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
