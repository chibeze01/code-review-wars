import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#fffaf0',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '60px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Left column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            paddingRight: 64,
          }}
        >
          {/* Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: '#16a34a',
                border: '2.5px solid #1c1917',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                marginRight: 14,
              }}
            >
              ⚔️
            </div>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: '#57534e',
              }}
            >
              Code Review Wars
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize: 62,
              fontWeight: 800,
              color: '#1c1917',
              lineHeight: 1.1,
              marginBottom: 24,
            }}
          >
            Become the dev who catches the bug{' '}
            <span
              style={{
                background: '#ffd43b',
                borderRadius: 6,
                padding: '0 6px',
              }}
            >
              everyone else merged.
            </span>
          </div>

          {/* Subtext */}
          <div
            style={{
              fontSize: 22,
              color: '#57534e',
              lineHeight: 1.5,
            }}
          >
            Real, messy production code · graded like a staff engineer.
          </div>
        </div>

        {/* Right column — mock code card */}
        <div
          style={{
            width: 420,
            background: '#ffffff',
            border: '2.5px solid #1c1917',
            borderRadius: 16,
            boxShadow: '6px 6px 0 #1c1917',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          {/* Window chrome */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '2px solid #e7e5e4',
              background: '#fafaf9',
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                background: '#ff6a3d',
                marginRight: 6,
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                background: '#ffd43b',
                marginRight: 6,
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                background: '#16a34a',
                marginRight: 12,
              }}
            />
            <span style={{ fontSize: 13, color: '#8a827b', fontFamily: 'monospace' }}>
              checkout.ts
            </span>
            <div
              style={{
                marginLeft: 'auto',
                background: '#dcfce7',
                border: '1.5px solid #16a34a',
                borderRadius: 999,
                padding: '2px 10px',
                fontSize: 12,
                fontWeight: 700,
                color: '#16a34a',
              }}
            >
              Grade A
            </div>
          </div>

          {/* Code lines */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '16px 0',
              fontFamily: 'monospace',
              fontSize: 13,
            }}
          >
            <div
              style={{
                display: 'flex',
                padding: '2px 16px',
                color: '#8a827b',
              }}
            >
              <span style={{ marginRight: 16, color: '#d6d3d1' }}>3</span>
              <span>{'const cart = await db.query('}</span>
            </div>
            <div
              style={{
                display: 'flex',
                padding: '2px 16px',
                background: '#ffe2d6',
                borderLeft: '3px solid #ff6a3d',
              }}
            >
              <span style={{ marginRight: 16, color: '#d6d3d1' }}>4</span>
              <span style={{ color: '#1c1917' }}>{' `SELECT * FROM carts WHERE id=${id}`'}</span>
            </div>
            <div style={{ display: 'flex', padding: '2px 16px', color: '#8a827b' }}>
              <span style={{ marginRight: 16, color: '#d6d3d1' }}>6</span>
              <span>{'for (const item of cart.items) {'}</span>
            </div>
            <div
              style={{
                display: 'flex',
                padding: '2px 16px',
                background: '#fff3c4',
                borderLeft: '3px solid #ffd43b',
              }}
            >
              <span style={{ marginRight: 16, color: '#d6d3d1' }}>7</span>
              <span style={{ color: '#1c1917' }}>{'  await db.getProduct(item.id) // N+1'}</span>
            </div>

            {/* Annotation bar */}
            <div
              style={{
                margin: '12px 16px 4px',
                background: '#fafaf9',
                border: '1.5px solid #e7e5e4',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 12,
                color: '#57534e',
              }}
            >
              🛡️ Line 4: SQL injection — id is unescaped
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
