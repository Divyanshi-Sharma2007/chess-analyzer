import { useState } from 'react'
import { fetchLichessGames } from '../api/lichess'
import { fetchChesscomGames } from '../api/chesscom'
import { loadSetting, saveSetting } from '../lib/settings'
import { btnPrimary, field } from '../lib/ui'

export default function ImportGames({ onPick }) {
  const [site, setSite] = useState(() => loadSetting('site', 'lichess'))
  const [username, setUsername] = useState(() => loadSetting('username', ''))
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchGames = async () => {
    const name = username.trim()
    if (!name) return
    setLoading(true)
    setError('')
    setGames([])
    try {
      const list =
        site === 'lichess' ? await fetchLichessGames(name) : await fetchChesscomGames(name)
      if (!list.length) setError('No games found.')
      setGames(list)
      saveSetting('site', site)
      saveSetting('username', name)
    } catch (e) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const resultColor = (r) =>
    r === '1-0' ? 'text-emerald-400' : r === '0-1' ? 'text-red-400' : 'text-slate-400'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select value={site} onChange={(e) => setSite(e.target.value)} className={field}>
          <option value="lichess">Lichess</option>
          <option value="chesscom">Chess.com</option>
        </select>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchGames()}
          placeholder="Username"
          className={`${field} flex-1 min-w-[140px]`}
        />
        <button onClick={fetchGames} disabled={loading} className={btnPrimary}>
          {loading ? 'Loading...' : 'Get games'}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {games.length > 0 && (
        <div className="rounded-xl border border-white/10 divide-y divide-white/5 max-h-64 overflow-y-auto">
          {games.map((g) => (
            <button
              key={g.id}
              onClick={() => onPick(g.pgn)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-emerald-500/10 transition flex justify-between gap-2 cursor-pointer"
            >
              <span className="truncate">
                {g.white} <span className="text-slate-500">vs</span> {g.black}
              </span>
              <span className="shrink-0 text-slate-400">
                <b className={resultColor(g.result)}>{g.result}</b> ·{' '}
                {new Date(g.date).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}