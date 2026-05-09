import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="page-loader">
        <div className="logo">ArtMind AI</div>
        <div className="spinner spinner-dark" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={`/auth?mode=signin&next=${location.pathname}`} replace />
  }

  return <>{children}</>
}
