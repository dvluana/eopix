import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFD600',
          borderRadius: 40,
        }}
      >
        <div
          style={{
            fontSize: 130,
            fontWeight: 700,
            color: '#1A1A1A',
            lineHeight: 1,
            marginTop: -6,
          }}
        >
          ?
        </div>
      </div>
    ),
    { ...size }
  )
}
