const KEYS = ['White', 'Black', 'Result', 'Date', 'FEN', 'SetUp']

export function buildShareLink(game) {
  let pgn = ''
  KEYS.forEach((k) => {
    if (game.headers[k]) pgn += `[${k} "${game.headers[k]}"]\n`
  })
  pgn += '\n'
  game.moves.forEach((m, i) => {
    if (i % 2 === 0) pgn += `${i / 2 + 1}. `
    pgn += m.san + ' '
  })

  const b64 = btoa(encodeURIComponent(pgn))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return `${location.origin}${location.pathname}#pgn=${b64}`
}

export function readSharedPgn() {
  const m = location.hash.match(/^#pgn=(.+)$/)
  if (!m) return null
  try {
    let b = m[1].replace(/-/g, '+').replace(/_/g, '/')
    while (b.length % 4) b += '='
    return decodeURIComponent(atob(b))
  } catch {
    return null
  }
}