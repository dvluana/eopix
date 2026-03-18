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
    default: "EOPIX | Consulta de Risco CPF e CNPJ",
    template: "%s | EOPIX",
  },
  description:
    "Consulte CPF e CNPJ antes de fechar negócio. Relatório completo: dados cadastrais, processos judiciais e análise de risco por R$ 39,90.",
  keywords: [
    "consulta cnpj",
    "consulta cpf",
    "consultar cnpj online",
    "consultar cpf de terceiros",
    "análise de risco",
    "due diligence",
    "verificar empresa",
    "score cnpj",
  ],
  authors: [{ name: "EOPIX" }],
  creator: "EOPIX",
  publisher: "EOPIX",
  metadataBase: new URL("https://somoseopix.com.br"),
  alternates: {
    canonical: "https://somoseopix.com.br",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://somoseopix.com.br",
    title: "EOPIX | Consulta de Risco CPF e CNPJ",
    description:
      "Consulte CPF e CNPJ antes de fechar negócio. Relatório completo com análise de risco por R$ 39,90.",
    siteName: "EOPIX",
  },
  twitter: {
    card: "summary_large_image",
    title: "EOPIX | Consulta de Risco CPF e CNPJ",
    description:
      "Consulte CPF e CNPJ antes de fechar negócio. Relatório completo com análise de risco por R$ 39,90.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://somoseopix.com.br/#organization",
      name: "EOPIX",
      url: "https://somoseopix.com.br",
      logo: "https://somoseopix.com.br/icon.png",
      description:
        "Plataforma brasileira de verificação de risco CPF e CNPJ. Relatórios completos com análise de dados cadastrais, processos judiciais e reputação web.",
      areaServed: "BR",
      knowsLanguage: "pt-BR",
    },
    {
      "@type": "WebSite",
      "@id": "https://somoseopix.com.br/#website",
      url: "https://somoseopix.com.br",
      name: "EOPIX",
      publisher: { "@id": "https://somoseopix.com.br/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate:
            "https://somoseopix.com.br/consulta/{search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
}

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
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
