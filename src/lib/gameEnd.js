import { Chess } from 'chess.js'

// Aakhri position dekh ke batata hai game kaise khatam hua
export function getGameEnd(game) {
  const fen = game.fens[game.fens.length - 1]
  const chess = new Chess(fen)
  const result = game.headers.Result
  const name = (c) => (c === 'w' ? 'White' : 'Black')

  let kind = null // 'win' | 'draw'
  let winner = null
  let title = ''
  let subtitle = ''
  let how = '' // 'mate' | 'other'

  if (chess.isCheckmate()) {
    winner = chess.turn() === 'w' ? 'b' : 'w'
    kind = 'win'
    title = 'Checkmate'
    subtitle = `${name(winner)} wins`
    how = 'mate'
  } else if (chess.isStalemate()) {
    kind = 'draw'
    title = 'Draw'
    subtitle = 'Stalemate'
  } else if (chess.isInsufficientMaterial()) {
    kind = 'draw'
    title = 'Draw'
    subtitle = 'Insufficient material'
  } else if (chess.isThreefoldRepetition()) {
    kind = 'draw'
    title = 'Draw'
    subtitle = 'Threefold repetition'
  } else if (chess.isDrawByFiftyMoves()) {
    kind = 'draw'
    title = 'Draw'
    subtitle = '50-move rule'
  } else if (result === '1-0' || result === '0-1') {
    // Resign / timeout / abandon: board se pata nahi chalta, header se lete hain
    winner = result === '1-0' ? 'w' : 'b'
    kind = 'win'
    title = `${name(winner)} wins`
    subtitle = game.headers.Termination || 'Resignation or timeout'
    how = 'other'
  } else if (result === '1/2-1/2') {
    kind = 'draw'
    title = 'Draw'
    subtitle = game.headers.Termination || 'Draw agreed'
  } else {
    return null // game chal raha hai ya result unknown
  }

  // King ke squares dhundo
  const kings = {}
  chess.board().forEach((row) =>
    row.forEach((p) => {
      if (p && p.type === 'k') kings[p.color] = p.square
    })
  )

  const badges = []
  if (kind === 'draw') {
    badges.push({ square: kings.w, text: '½', cls: 'bg-slate-500 text-white' })
    badges.push({ square: kings.b, text: '½', cls: 'bg-slate-500 text-white' })
  } else {
    const loser = winner === 'w' ? 'b' : 'w'
    badges.push({ square: kings[winner], text: '👑', cls: 'bg-amber-400 text-black' })
    badges.push({
      square: kings[loser],
      text: how === 'mate' ? '#' : '🏳️',
      cls: 'bg-red-500 text-white',
    })
  }

  return { kind, winner, title, subtitle, badges }
}