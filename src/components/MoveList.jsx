import { LABELS } from '../lib/classifyMoves'

export default function MoveList({ moves, current, onSelect, labels }) {
  const rows = []
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({ num: i / 2 + 1, white: moves[i], black: moves[i + 1], wi: i + 1, bi: i + 2 })
  }

  const cell = (move, index) => {
    if (!move) return <span />
    const label = labels ? LABELS[labels[index - 1]] : null
    const active = current === index
    return (
      <button
        onClick={() => onSelect(index)}
        className={`flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg text-left transition cursor-pointer ${
          active
            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
            : 'hover:bg-white/10 text-slate-200'
        }`}
      >
        <span className="font-medium">{move.san}</span>
        {label && (
          <span
            className={`text-[11px] font-bold px-1.5 rounded ${
              active ? 'bg-white/25 text-white' : label.badge
            }`}
          >
            {label.symbol}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="h-[26rem] overflow-y-auto pr-1 text-sm space-y-0.5">
      {rows.map((r) => (
        <div key={r.num} className="grid grid-cols-[2rem_1fr_1fr] items-center gap-1">
          <span className="text-slate-500 text-xs pl-1">{r.num}.</span>
          {cell(r.white, r.wi)}
          {cell(r.black, r.bi)}
        </div>
      ))}
    </div>
  )
}