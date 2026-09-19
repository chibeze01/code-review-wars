import { ImageResponse } from 'next/og'
import { SITE } from '@/lib/site'

export const alt = `${SITE.name} — practice the code review interview round`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background: '#fffaf0',
          color: '#1c1917',
          fontFamily: 'sans-serif',
          border: '14px solid #1c1917',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              border: '5px solid #1c1917',
              background: '#16a34a',
              boxShadow: '6px 6px 0 #1c1917',
            }}
          />
          <div style={{ fontSize: 40, fontWeight: 800 }}>{SITE.name}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>
            Become the dev who catches the bug everyone else merged.
          </div>
          <div style={{ fontSize: 30, color: '#57534e' }}>
            Real code, real bugs, graded like a staff engineer. Built for the code review round.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              padding: '14px 28px',
              border: '5px solid #1c1917',
              borderRadius: 999,
              background: '#dcfce7',
              fontSize: 28,
              fontWeight: 700,
              boxShadow: '6px 6px 0 #1c1917',
            }}
          >
            3 free sessions · no card · no subscription
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
