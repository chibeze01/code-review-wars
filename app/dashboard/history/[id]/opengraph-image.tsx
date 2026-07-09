import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const GRADE_COLORS: Record<string, string> = {
  A: '#16a34a',
  B: '#3b82f6',
  C: '#ca8a04',
  D: '#ff6a3d',
  F: '#dc2626',
}

export default async function OgImage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()
  const { data: session } = await supabase
    .from('review_sessions')
    .select('grade, score, language, scenario')
    .eq('id', params.id)
    .eq('status', 'completed')
    .single()

  const grade = session?.grade ?? '?'
  const score = session?.score ?? 0
  const language = session?.language ?? 'TypeScript'
  const scenario = session?.scenario ?? 'Code Review Session'
  const gradeColor = GRADE_COLORS[grade] ?? '#57534e'
  const truncatedScenario = scenario.length > 80 ? scenario.slice(0, 80) + '…' : scenario
  const barFill = Math.round((score / 100) * 420)

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#1c1917',
          display: 'flex',
          flexDirection: 'column',
          padding: '52px 64px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top logo row */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 48 }}>
          <div
            style={{
              width: 44,
              height: 44,
              background: '#16a34a',
              border: '2px solid #ffffff30',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              marginRight: 14,
            }}
          >
            ⚔️
          </div>
          <span style={{ color: '#d6d3d1', fontSize: 22, fontWeight: 700 }}>
            Code Review Wars
          </span>
        </div>

        {/* Main content row */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          {/* Grade circle */}
          <div
            style={{
              width: 180,
              height: 180,
              borderRadius: 90,
              border: `5px solid ${gradeColor}`,
              background: `${gradeColor}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 110,
              fontWeight: 800,
              color: gradeColor,
              flexShrink: 0,
              marginRight: 64,
            }}
          >
            {grade}
          </div>

          {/* Right info column */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Language pill */}
            <div style={{ display: 'flex', marginBottom: 20 }}>
              <div
                style={{
                  border: '2px solid #ffffff30',
                  borderRadius: 999,
                  padding: '4px 16px',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#d6d3d1',
                }}
              >
                {language}
              </div>
            </div>

            {/* Scenario */}
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: '#fffaf0',
                lineHeight: 1.3,
                marginBottom: 32,
              }}
            >
              {truncatedScenario}
            </div>

            {/* Score */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    color: '#8a827b',
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                  }}
                >
                  SCORE
                </span>
                <span
                  style={{
                    color: '#fffaf0',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                  }}
                >
                  {score}/100
                </span>
              </div>
              {/* Bar track */}
              <div
                style={{
                  width: 420,
                  height: 14,
                  background: '#ffffff15',
                  borderRadius: 7,
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    width: barFill,
                    height: 14,
                    background: gradeColor,
                    borderRadius: 7,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 40,
          }}
        >
          <span style={{ color: '#57534e', fontSize: 16 }}>reviewed on Code Review Wars</span>
          <span style={{ color: '#57534e', fontSize: 16, fontFamily: 'monospace' }}>
            {process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '') ?? 'codereviewwars.com'}
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
