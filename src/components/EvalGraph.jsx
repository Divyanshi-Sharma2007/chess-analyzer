import { AreaChart, Area, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts'
import { toCp } from '../lib/classifyMoves'

export default function EvalGraph({ results, index, onSelect }) {
  const data = results.map((r, i) => ({
    move: i,
    eval: Math.max(-10, Math.min(10, toCp(r) / 100)),
  }))

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-2">Evaluation graph</h3>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            onClick={(s) => {
              if (s && s.activeTooltipIndex != null) onSelect(Number(s.activeTooltipIndex))
            }}
          >
            <defs>
              <linearGradient id="evalFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis dataKey="move" hide />
            <YAxis domain={[-10, 10]} hide />
            <Tooltip
              contentStyle={{
                background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#e2e8f0',
              }}
              formatter={(v) => v.toFixed(2)}
              labelFormatter={(l) => `Move ${l}`}
            />
            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4" />
            <ReferenceLine x={index} stroke="#fbbf24" strokeWidth={2} />
            <Area
              type="monotone"
              dataKey="eval"
              stroke="#34d399"
              strokeWidth={2}
              fill="url(#evalFill)"
              isAnimationActive={false}
              baseValue={0}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}