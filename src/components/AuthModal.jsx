import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { btnPrimary, field } from '../lib/ui'

export default function AuthModal({ onClose }) {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') await login(email, password)
      else await signup(name, email, password)
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const onEnter = (e) => e.key === 'Enter' && submit()

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-sm p-6 space-y-4 bg-slate-900/90 fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl cursor-pointer">
            ✕
          </button>
        </div>

        {mode === 'signup' && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onEnter}
            placeholder="Name"
            className={`${field} w-full`}
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={onEnter}
          placeholder="Email"
          className={`${field} w-full`}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onEnter}
          placeholder="Password (min 6 characters)"
          className={`${field} w-full`}
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button onClick={submit} disabled={busy} className={`${btnPrimary} w-full`}>
          {busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>

        <p className="text-sm text-slate-400 text-center">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError('')
            }}
            className="text-emerald-400 hover:underline cursor-pointer"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}