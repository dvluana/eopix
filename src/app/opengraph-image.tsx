import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'E o Pix? — Consulta de Empresas e Pessoas'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const fontsDir = join(process.cwd(), 'src/app/fonts')

  const [zillaBold, plexSemiBold, plexRegular] = await Promise.all([
    readFile(join(fontsDir, 'ZillaSlab-Bold.ttf')),
    readFile(join(fontsDir, 'IBMPlexMono-SemiBold.ttf')),
    readFile(join(fontsDir, 'IBMPlexMono-Regular.ttf')),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1A1A1A',
          fontFamily: 'IBM Plex Mono',
          position: 'relative',
        }}
      >
        {/* Top yellow accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: '#FFD600',
          }}
        />

        {/* Decorative yellow dot — top right */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: 60,
            width: 48,
            height: 48,
            borderRadius: 24,
            background: '#FFD600',
            opacity: 0.25,
          }}
        />

        {/* Decorative yellow dot — bottom left */}
        <div
          style={{
            position: 'absolute',
            bottom: 50,
            left: 70,
            width: 32,
            height: 32,
            borderRadius: 16,
            background: '#FFD600',
            opacity: 0.15,
          }}
        />

        {/* Brand name */}
        <div
          style={{
            fontSize: 88,
            fontFamily: 'Zilla Slab',
            fontWeight: 700,
            color: '#FFD600',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          e o pix?
        </div>

        {/* Yellow underline accent */}
        <div
          style={{
            width: 220,
            height: 5,
            background: '#FFD600',
            marginTop: 24,
            marginBottom: 32,
            borderRadius: 3,
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: 30,
            fontWeight: 600,
            color: '#FFFFFF',
            letterSpacing: '0.06em',
          }}
        >
          CONSULTA CPF & CNPJ
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 400,
            color: '#888888',
            marginTop: 16,
          }}
        >
          {`Relat\u00f3rios de risco em minutos`}
        </div>

        {/* Bottom yellow accent bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 8,
            background: '#FFD600',
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Zilla Slab', data: zillaBold, style: 'normal' as const, weight: 700 },
        { name: 'IBM Plex Mono', data: plexSemiBold, style: 'normal' as const, weight: 600 },
        { name: 'IBM Plex Mono', data: plexRegular, style: 'normal' as const, weight: 400 },
      ],
    }
  )
}
