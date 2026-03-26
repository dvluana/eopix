import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  transpilePackages: ['next-sanity'],

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
    domains: ['cdn.sanity.io'],
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

export default withSentryConfig(nextConfig, {
  org: 'uxnaut',
  project: 'eopix',

  // Upload sourcemaps automaticamente no build (requer SENTRY_AUTH_TOKEN)
  silent: !process.env.CI,

  // Release tracking automático via VERCEL_GIT_COMMIT_SHA
  release: {
    name: process.env.VERCEL_GIT_COMMIT_SHA || process.env.SENTRY_RELEASE,
    deploy: {
      env: process.env.VERCEL_ENV || process.env.NODE_ENV,
    },
  },

  // Esconde sourcemaps do bundle público (só Sentry acessa)
  hideSourceMaps: true,

  // Tree-shake logs de debug do Sentry no bundle
  webpack: { treeshake: { removeDebugLogging: true } },

  // Tunneling para evitar ad-blockers
  tunnelRoute: '/monitoring',
});
