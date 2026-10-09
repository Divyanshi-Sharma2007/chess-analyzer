import { winPercent } from '../components/EvalBar'

export const LABELS = {
  best: { text: 'Best', symbol: '★', color: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
  excellent: { text: 'Excellent', symbol: '!', color: 'text-green-400', badge: 'bg-green-500/20 text-green-300' },
  good: { text: 'Good', symbol: '✓', color: 'text-slate-400', badge: 'bg-slate-500/20 text-slate-300' },
  inaccuracy: { text: 'Inaccuracy', symbol: '?!', color: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300' },
  mistake: { text: 'Mistake', symbol: '?', color: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300' },
  blunder: { text: 'Blunder', symbol: '??', color: 'text-red-400', badge: 'bg-red-500/20 text-red-300' },
}

// result -> centipawns (white's view), mate capped at +-1000
function toCp(r) {
  if (r.mate !== null) return r.mate > 0 ? 1000 : -1000
  return Math.max(-1000, Math.min(1000, r.cp))
}

export function classifyMoves(moves, results) {
  const labels = []
  const acc = { w: [], b: [] }

  moves.forEach((move, i) => {
    const before = results[i]
    const after = results[i + 1]
    const winW = (r) => winPercent(toCp(r))

    const moverBefore = move.color === 'w' ? winW(before) : 100 - winW(before)
    const moverAfter = move.color === 'w' ? winW(after) : 100 - winW(after)
    const drop = Math.max(0, moverBefore - moverAfter)

    const uci = move.from + move.to + (move.promotion || '')
    let label
    if (uci === before.bestMove) label = 'best'
    else if (drop < 2) label = 'excellent'
    else if (drop < 5) label = 'good'
    else if (drop < 10) label = 'inaccuracy'
    else if (drop < 20) label = 'mistake'
    else label = 'blunder'

    labels.push(label)

    const accuracy = Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * drop) - 3.1669))
    acc[move.color].push(accuracy)
  })

  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)
  return { labels, accuracy: { white: avg(acc.w), black: avg(acc.b) } }
}

export { toCp }