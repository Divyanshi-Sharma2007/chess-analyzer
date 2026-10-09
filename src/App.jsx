import { useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Analyzer from './Analyzer'

export default function App() {
  const { user, loading } = useAuth()

  // Refresh par login check ho raha hai
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-slate-400">
        Loading...
      </div>
    )
  }

  // Login nahi hai: sirf Landing page
  if (!user) return <Landing />

  // Login hai: poora analyzer
  return <Analyzer />
}