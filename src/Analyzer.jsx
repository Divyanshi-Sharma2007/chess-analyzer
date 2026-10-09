import { useState, useEffect, useRef, useMemo } from 'react'
import { Chessboard } from 'react-chessboard'
import { parsePgn } from './lib/parsePgn'
import { Engine } from './lib/engine'
import { analyzeGame } from './lib/analyzeGame'
import { classifyMoves, LABELS } from './lib/classifyMoves'
import { uciToSan } from './lib/uci'
import { buildShareLink, readSharedPgn } from './lib/share'
import { loadSetting, saveSetting } from './lib/settings'
import { playMoveSound } from './lib/sounds'
import { getGameEnd } from './lib/gameEnd'
import { btnPrimary, btnBlue, btnGhost, field } from './lib/ui'
import PgnInput from './components/PgnInput'
import ImportGames from './components/ImportGames'
import MoveList from './components/MoveList'
import EvalBar from './components/EvalBar'
import EvalGraph from './components/EvalGraph'
import { useAuth } from './context/AuthContext'
import AuthModal from './components/AuthModal'

function AccuracyRing({ title, value, dot }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div
        className="relative w-20 h-20 rounded-full grid place-items-center shrink-0"
        style={{ background: `conic-gradient(#10b981 ${value * 3.6}deg, #1e293b 0deg)` }}
      >
        <div className="absolute inset-[7px] rounded-full bg-[#0f1729] grid place-items-center">
          <span className="text-lg font-extrabold">{value.toFixed(0)}</span>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className={`inline-block w-3 h-3 rounded-full ${dot}`} />
          {title}
        </div>
        <div className="text-2xl font-bold">{value.toFixed(1)}%</div>
        <div className="text-xs text-slate-500">accuracy</div>
      </div>
    </div>
  )
}

export default function Analyzer() {
  const [game, setGame] = useState(null)
  const { user, loading: authLoading, logout } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [index, setIndex] = useState(0)
  const [error, setError] = useState('')
  const [pgnText, setPgnText] = useState('')
  const [tab, setTab] = useState('paste')
  const [liveResult, setLiveResult] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [progress, setProgress] = useState(null)
  const [copied, setCopied] = useState(false)
  const [flipped, setFlipped] = useState(false)

  // Saved settings
  const [depth, setDepth] = useState(() => loadSetting('depth', 14))
  const [showArrow, setShowArrow] = useState(() => loadSetting('showArrow', true))
  const [muted, setMuted] = useState(() => loadSetting('muted', false))
  useEffect(() => saveSetting('depth', depth), [depth])
  useEffect(() => saveSetting('showArrow', showArrow), [showArrow])
  useEffect(() => saveSetting('muted', muted), [muted])

  const engineRef = useRef(null)
  const runId = useRef(0)
  const boardTop = useRef(null)
  const prevIndex = useRef(0)

  useEffect(() => {
    engineRef.current = new Engine()
    return () => engineRef.current.destroy()
  }, [])

  const loadGame = (pgn) => {
    try {
      const clean = pgn.replace(/\{[^}]*\}/g, '').trim()
      const parsed = parsePgn(clean)
      runId.current++
      setProgress(null)
      setAnalysis(null)
      setLiveResult(null)
      setPgnText(pgn)
      setGame(parsed)
      setIndex(0)
      prevIndex.current = 0
      setError('')
      setTimeout(() => boardTop.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (e) {
      console.error('PGN error:', e, pgn)
      setError('Could not load this game: ' + (e.message || 'Invalid PGN'))
    }
  }

  useEffect(() => {
    const shared = readSharedPgn()
    if (shared) loadGame(shared)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const total = game ? game.moves.length : 0
  const goTo = (i) => setIndex(Math.max(0, Math.min(total, i)))

  // Move sound
  useEffect(() => {
    const prev = prevIndex.current
    prevIndex.current = index
    if (!game || muted || index === prev) return
    if (index === prev + 1) playMoveSound(game.moves[index - 1])
    else if (index === prev - 1) playMoveSound(null)
  }, [index]) // eslint-disable-line react-hooks/exhaustive-deps

  const startAnalysis = async () => {
    const id = ++runId.current
    setAnalysis(null)
    setProgress({ done: 0, total: game.fens.length })
    const res = await analyzeGame(
      engineRef.current,
      game.fens,
      depth,
      (done, tot) => id === runId.current && setProgress({ done, total: tot }),
      () => id !== runId.current
    )
    if (res && id === runId.current) {
      setAnalysis(res)
      setProgress(null)
    }
  }

  useEffect(() => {
    if (!game || analysis || progress) return
    let cancelled = false
    engineRef.current.analyze(game.fens[index], 14).then((r) => {
      if (!cancelled) setLiveResult(r)
    })
    return () => {
      cancelled = true
    }
  }, [game, index, analysis, progress])

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(total, i + 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [total])

  const classified = useMemo(
    () => (analysis && game ? classifyMoves(game.moves, analysis) : null),
    [analysis, game]
  )

  const counts = useMemo(() => {
    if (!classified) return null
    const c = { w: {}, b: {} }
    game.moves.forEach((m, i) => {
      const l = classified.labels[i]
      c[m.color][l] = (c[m.color][l] || 0) + 1
    })
    return c
  }, [classified, game])

  // Game end (win / draw / checkmate)
  const end = useMemo(() => (game ? getGameEnd(game) : null), [game])
  const showEnd = end && index === total && total > 0

  const badgePos = (square) => {
    const f = square.charCodeAt(0) - 97 // a..h -> 0..7
    const r = Number(square[1]) // 1..8
    return flipped
      ? { left: `${(8 - f) * 12.5}%`, top: `${(r - 1) * 12.5}%` }
      : { left: `${(f + 1) * 12.5}%`, top: `${(8 - r) * 12.5}%` }
  }

  const result = analysis ? analysis[index] : liveResult
  const hasBest = result && result.bestMove && result.bestMove !== '(none)'
  const bestSan = hasBest && game ? uciToSan(game.fens[index], result.bestMove) : null

  const arrows =
    showArrow && hasBest
      ? [
          {
            startSquare: result.bestMove.slice(0, 2),
            endSquare: result.bestMove.slice(2, 4),
            color: 'rgb(16, 185, 129)',
          },
        ]
      : []

  const copyLink = async () => {
    const link = buildShareLink(game)
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', link)
    }
  }

  const tabBtn = (name) =>
    `px-4 py-2 text-sm rounded-lg transition cursor-pointer ${
      tab === name
        ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
        : 'text-slate-400 hover:text-slate-200'
    }`
  const currentLabel = classified && index > 0 ? LABELS[classified.labels[index - 1]] : null

  const countChip = (side, key) =>
    counts && (
      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${LABELS[key].badge}`}>
        {counts[side][key] || 0} {LABELS[key].text}
      </span>
    )

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-6">
      <div className="flex justify-end items-center gap-3 pt-2">
  {authLoading ? null : user ? (
    <>
      <span className="text-sm text-slate-300">
        👤 Hi, <b className="text-emerald-300">{user.name}</b>
      </span>
      <button onClick={logout} className={btnGhost}>Logout</button>
    </>
  ) : (
    <button onClick={() => setShowAuth(true)} className={btnPrimary}>Login / Sign up</button>
  )}
     </div>
      {/* Header */}
      <header className="text-center pt-4 sm:pt-8 space-y-3 fade-up">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
          ♞ Chess Analyzer
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Paste a game, let Stockfish find your mistakes. Free, private, and runs fully in your browser.
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-300">
          {['⚡ Stockfish engine', '📊 Eval graph', '🎯 Move ratings', '🔗 Share link'].map((t) => (
            <span key={t} className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
              {t}
            </span>
          ))}
        </div>
      </header>

      {/* Input card */}
      <section className="card p-4 sm:p-6 fade-up">
        <div className="inline-flex gap-1 p-1 mb-4 rounded-xl bg-slate-900/60 border border-white/10">
          <button className={tabBtn('paste')} onClick={() => setTab('paste')}>
            Paste / Upload PGN
          </button>
          <button className={tabBtn('import')} onClick={() => setTab('import')}>
            Import by username
          </button>
        </div>
        {tab === 'paste' ? (
          <PgnInput text={pgnText} setText={setPgnText} onLoad={loadGame} error={error} />
        ) : (
          <>
            <ImportGames onPick={loadGame} />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </>
        )}
      </section>

      {game && (
        <div ref={boardTop} className="space-y-6 fade-up">
          {/* Controls */}
          <section className="card p-4 flex flex-wrap items-center gap-3">
            <select
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className={field}
              disabled={!!progress}
            >
              <option value={10}>Fast (depth 10)</option>
              <option value={14}>Normal (depth 14)</option>
              <option value={18}>Deep (depth 18)</option>
            </select>
            <button onClick={startAnalysis} disabled={!!progress} className={btnBlue}>
              {progress ? 'Analyzing...' : '🔍 Analyze full game'}
            </button>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showArrow}
                onChange={(e) => setShowArrow(e.target.checked)}
                className="accent-emerald-500 w-4 h-4"
              />
              Best-move arrow
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={!muted}
                onChange={(e) => setMuted(!e.target.checked)}
                className="accent-emerald-500 w-4 h-4"
              />
              🔊 Sound
            </label>
            <div className="flex gap-2 ml-auto">
              <button onClick={() => setFlipped((f) => !f)} className={btnGhost}>
                🔄 Flip
              </button>
              <button onClick={copyLink} className={btnGhost}>
                {copied ? '✅ Copied!' : '🔗 Share'}
              </button>
            </div>

            {progress && (
              <div className="w-full">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all"
                    style={{ width: `${(progress.done / progress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {progress.done} / {progress.total} positions
                </p>
              </div>
            )}
          </section>

          <div className="grid lg:grid-cols-[minmax(0,560px)_1fr] gap-6">
            {/* Board */}
            <section className="card p-4">
              <div className="flex gap-2">
                <EvalBar result={result} />
                <div className="flex-1 min-w-0 relative">
                  <Chessboard
                    options={{
                      position: game.fens[index],
                      allowDragging: false,
                      boardOrientation: flipped ? 'black' : 'white',
                      arrows,
                      darkSquareStyle: { backgroundColor: '#769656' },
                      lightSquareStyle: { backgroundColor: '#eeeed2' },
                      boardStyle: {
                        borderRadius: '10px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      },
                    }}
                  />

                  {/* King badges */}
                  {showEnd &&
                    end.badges.map((b) => (
                      <div
                        key={b.square}
                        className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full grid place-items-center text-sm font-extrabold shadow-lg ring-2 ring-white/80 fade-up ${b.cls}`}
                        style={badgePos(b.square)}
                      >
                        {b.text}
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-center gap-2 mt-4">
                <button className={btnGhost} onClick={() => goTo(0)} disabled={index === 0}>⏮</button>
                <button className={btnGhost} onClick={() => goTo(index - 1)} disabled={index === 0}>◀</button>
                <button className={btnPrimary} onClick={() => goTo(index + 1)} disabled={index === total}>▶</button>
                <button className={btnGhost} onClick={() => goTo(total)} disabled={index === total}>⏭</button>
              </div>

              <div className="mt-3 text-center space-y-1 min-h-[3rem]">
                {/* Result banner */}
                {showEnd && (
                  <div
                    className={`mb-2 rounded-xl px-4 py-2 fade-up border ${
                      end.kind === 'draw'
                        ? 'bg-slate-500/20 border-slate-400/30 text-slate-200'
                        : 'bg-amber-400/15 border-amber-300/30 text-amber-200'
                    }`}
                  >
                    <div className="text-lg font-extrabold">
                      {end.kind === 'draw' ? '🤝' : '🏆'} {end.title}
                    </div>
                    <div className="text-xs opacity-80">{end.subtitle}</div>
                  </div>
                )}

                {bestSan && (
                  <p className="text-sm text-slate-400">
                    Best move: <b className="text-emerald-400">{bestSan}</b>{' '}
                    <span className="text-slate-500">(depth {result.depth})</span>
                  </p>
                )}
                {currentLabel && (
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${currentLabel.badge}`}
                  >
                    {game.moves[index - 1].san}: {currentLabel.text} {currentLabel.symbol}
                  </span>
                )}
              </div>
            </section>

            {/* Side panel */}
            <section className="space-y-4 min-w-0">
              <div className="card p-4 flex items-center justify-between gap-2">
                <div className="min-w-0 truncate font-semibold">
                  ⚪ {game.headers.White || 'White'}{' '}
                  <span className="text-slate-500 font-normal">vs</span> ⚫{' '}
                  {game.headers.Black || 'Black'}
                </div>
                {game.headers.Result && (
                  <span className="px-2 py-1 rounded-md bg-white/10 text-sm font-bold shrink-0">
                    {game.headers.Result}
                  </span>
                )}
              </div>

              {classified && (
                <>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <AccuracyRing title="White" value={classified.accuracy.white} dot="bg-white" />
                    <AccuracyRing title="Black" value={classified.accuracy.black} dot="bg-slate-500" />
                  </div>
                  <div className="card p-3 grid sm:grid-cols-2 gap-3 text-xs">
                    {[
                      ['White', 'w'],
                      ['Black', 'b'],
                    ].map(([name, side]) => (
                      <div key={side} className="space-y-1.5">
                        <div className="text-slate-400">{name}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {countChip(side, 'blunder')}
                          {countChip(side, 'mistake')}
                          {countChip(side, 'inaccuracy')}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="card p-3">
                <MoveList
                  moves={game.moves}
                  current={index}
                  onSelect={goTo}
                  labels={classified?.labels}
                />
              </div>
            </section>
          </div>

          {analysis && <EvalGraph results={analysis} index={index} onSelect={goTo} />}
        </div>
      )}

      <footer className="text-center text-xs text-slate-500 pb-6">
        Built with React, chess.js and Stockfish. Nothing is uploaded or stored.
      </footer>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}