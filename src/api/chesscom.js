export async function fetchChesscomGames(username, max = 10) {
  const name = username.toLowerCase()
  const r1 = await fetch(
    `https://api.chess.com/pub/player/${encodeURIComponent(name)}/games/archives`
  )
  if (r1.status === 404) throw new Error('User not found on Chess.com.')
  if (!r1.ok) throw new Error('Chess.com error. Please try again later.')

  const { archives } = await r1.json()
  const games = []

  // newest month first, until we have enough games
  for (let i = archives.length - 1; i >= 0 && games.length < max; i--) {
    const r = await fetch(archives[i])
    if (!r.ok) break
    const data = await r.json()
    games.push(...data.games.filter((g) => g.pgn && g.rules === 'chess').reverse())
  }

  return games.slice(0, max).map((g) => ({
    id: g.uuid || g.url,
    white: g.white.username,
    black: g.black.username,
    result: (g.pgn.match(/\[Result "([^"]+)"\]/) || [])[1] || '',
    date: g.end_time * 1000,
    pgn: g.pgn,
  }))
}