/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Configuração para reduzir race conditions no dev mode
  // Mantém mais páginas compiladas em memória, evitando o erro middleware-manifest.json
  onDemandEntries: {
    // Tempo que uma página fica em memória sem ser acessada (15 minutos)
    maxInactiveAge: 15 * 60 * 1000,
    // Número de páginas mantidas em buffer
    pagesBufferLength: 4,
  },

  // Configurações de imagens
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
        ],
      },
    ];
  },

  // Configurações de ambiente
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

export default nextConfig;
