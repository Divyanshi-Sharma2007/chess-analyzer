import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

async function api(path, method = 'GET', body) {
  const res = await fetch('/api/auth' + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Something went wrong.')
  return data
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Page refresh par check karo ki pehle se logged in hai ya nahi
  useEffect(() => {
    api('/me')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const signup = async (name, email, password) =>
    setUser((await api('/signup', 'POST', { name, email, password })).user)

  const login = async (email, password) =>
    setUser((await api('/login', 'POST', { email, password })).user)

  const logout = async () => {
    await api('/logout', 'POST').catch(() => {})
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}