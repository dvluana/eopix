import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/termos', '/privacidade', '/blog/'],
        disallow: [
          '/admin/',
          '/api/',
          '/relatorio/',
          '/consulta/',
          '/compra/',
          '/minhas-consultas',
          '/erro/',
          '/manutencao',
        ],
      },
    ],
    sitemap: 'https://somoseopix.com.br/sitemap.xml',
  }
}
