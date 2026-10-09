export async function fetchLichessGames(username, max = 10) {
  const url =
    `https://lichess.org/api/games/user/${encodeURIComponent(username)}` +
    `?max=${max}&pgnInJson=true&clocks=false&evals=false&opening=false`

  const res = await fetch(url, { headers: { Accept: 'application/x-ndjson' } })
  if (res.status === 404) throw new Error('User not found on Lichess.')
  if (!res.ok) throw new Error('Lichess error. Please try again later.')

  const text = await res.text()
  const name = (p) =>
    p?.user?.name || (p?.aiLevel ? `Stockfish L${p.aiLevel}` : 'Anonymous')

  return text
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const g = JSON.parse(line)
      return {
        id: g.id,
        white: name(g.players.white),
        black: name(g.players.black),
        result: g.winner === 'white' ? '1-0' : g.winner === 'black' ? '0-1' : '1/2-1/2',
        date: g.createdAt,
        pgn: g.pgn,
      }
    })
}