const NAMES = ['move', 'capture', 'check', 'castle', 'end']
const audio = {}

// Pehle se load kar lo taaki turant baje
NAMES.forEach((n) => {
  const a = new Audio(`/sounds/${n}.mp3`)
  a.preload = 'auto'
  audio[n] = a
})

function play(name) {
  let a = audio[name]
  // File missing/kharab ho to normal move sound
  if (!a || a.error) a = audio.move
  const s = a.cloneNode() // tez chalne par sounds overlap ho sakein
  s.volume = 0.8
  s.play().catch(() => {})
}

// move = chess.js verbose move, ya null (peeche jaate waqt)
export function playMoveSound(move) {
  if (!move) return play('move')
  const san = move.san
  if (san.includes('#')) return play('end')
  if (san.includes('+')) return play('check')
  if (san.startsWith('O-O')) return play('castle')
  if (san.includes('x')) return play('capture')
  return play('move')
}