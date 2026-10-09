import { Chess } from 'chess.js'

// "g1f3" -> "Nf3"
export function uciToSan(fen, uci) {
  try {
    const chess = new Chess(fen)
    const m = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci[4],
    })
    return m.san
  } catch {
    return uci
  }
}