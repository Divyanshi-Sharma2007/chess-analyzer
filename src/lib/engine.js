export class Engine {
  constructor() {
    this.worker = new Worker('/stockfish/stockfish.js')
    this.listener = null
    this.busy = false
    this.queue = Promise.resolve()

    this.worker.onmessage = (e) => {
      const line = typeof e.data === 'string' ? e.data : ''
      if (this.listener) this.listener(line)
    }
    this.send('uci')
    this.send('isready')
  }

  send(cmd) {
    this.worker.postMessage(cmd)
  }

  // Returns { cp, mate, bestMove, depth } from WHITE's point of view
  analyze(fen, depth = 14) {
    if (this.busy) this.send('stop')

    const run = () =>
      new Promise((resolve) => {
        const whiteToMove = fen.split(' ')[1] === 'w'
        let last = { cp: 0, mate: null, depth: 0 }
        this.busy = true

        this.listener = (line) => {
          if (line.startsWith('info') && line.includes(' score ')) {
            const d = line.match(/ depth (\d+)/)
            const cp = line.match(/ score cp (-?\d+)/)
            const mate = line.match(/ score mate (-?\d+)/)
            const sign = whiteToMove ? 1 : -1
            if (d) last.depth = Number(d[1])
            if (cp) last = { ...last, cp: sign * Number(cp[1]), mate: null }
            if (mate) last = { ...last, mate: sign * Number(mate[1]) }
          }
          if (line.startsWith('bestmove')) {
            this.busy = false
            this.listener = null
            resolve({ ...last, bestMove: line.split(' ')[1] })
          }
        }

        this.send('position fen ' + fen)
        this.send('go depth ' + depth)
      })

    this.queue = this.queue.then(run)
    return this.queue
  }

  destroy() {
    this.worker.terminate()
  }
}