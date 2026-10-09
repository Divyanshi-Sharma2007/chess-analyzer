import { Chess } from 'chess.js'

export async function analyzeGame(engine, fens, depth, onProgress, isCancelled) {
  const results = []

  for (let i = 0; i < fens.length; i++) {
    if (isCancelled()) return null

    const chess = new Chess(fens[i])
    let r
    if (chess.isCheckmate()) {
      // side to move is checkmated
      r = { cp: chess.turn() === 'w' ? -1000 : 1000, mate: null, bestMove: '(none)', depth }
    } else if (chess.isDraw() || chess.isStalemate()) {
      r = { cp: 0, mate: null, bestMove: '(none)', depth }
    } else {
      r = await engine.analyze(fens[i], depth)
    }

    results.push(r)
    onProgress(i + 1, fens.length)
  }
  return results
}