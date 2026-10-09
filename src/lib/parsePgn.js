import { Chess } from 'chess.js'

export function parsePgn(pgnText) {
  const game = new Chess()
  game.loadPgn(pgnText) // throws an error if the PGN is invalid

  const moves = game.history({ verbose: true })
  const fens = [moves.length ? moves[0].before : game.fen()]
  moves.forEach((m) => fens.push(m.after))

  return { moves, fens, headers: game.getHeaders() }
}