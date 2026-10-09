import { useState } from 'react'
import AuthModal from '../components/AuthModal'
import { btnPrimary, btnGhost } from '../lib/ui'

export default function Landing() {
  const [open, setOpen] = useState(false)

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 min-h-screen flex flex-col justify-center text-center space-y-8">
      <header className="space-y-4 fade-up">
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
          ♞ Chess Analyzer
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-lg">
          Find your mistakes with Stockfish. Log in or create a free account to start analyzing your games.
        </p>
      </header>

      <div className="flex flex-wrap justify-center gap-3 fade-up">
        <button onClick={() => setOpen(true)} className={btnPrimary}>
          Login / Sign up
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 text-sm fade-up">
        {[
          ['⚡', 'Stockfish engine', 'Accurate move-by-move analysis'],
          ['🎯', 'Move ratings', 'Spot blunders, mistakes and best moves'],
          ['📥', 'Import games', 'From Lichess and Chess.com'],
        ].map(([icon, title, text]) => (
          <div key={title} className="card p-4 space-y-1">
            <div className="text-2xl">{icon}</div>
            <div className="font-semibold">{title}</div>
            <div className="text-slate-400">{text}</div>
          </div>
        ))}
      </div>

      {open && <AuthModal onClose={() => setOpen(false)} />}
    </div>
  )
}