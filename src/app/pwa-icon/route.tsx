import { ImageResponse } from 'next/og'

export async function GET(req: Request) {
  const size = Number(new URL(req.url).searchParams.get('size')) || 192
  const s = Math.min(Math.max(size, 64), 1024)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2563eb',
          color: 'white',
          fontSize: s * 0.55,
          fontWeight: 800,
        }}
      >
        C
      </div>
    ),
    { width: s, height: s }
  )
}