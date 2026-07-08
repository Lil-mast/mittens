import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing     from './pages/Landing'
import Dashboard   from './pages/Dashboard'
import AuthSuccess from './pages/AuthSuccess'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-border border-t-accent rounded-full" />
      </div>
    )
  }

  return user ? children : <Navigate to="/" replace />
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0F0F18',
              color: '#F0EBE0',
              border: '1px solid #1E1E2E',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#FF8A3D', secondary: '#08080D' } },
          }}
        />
        <Routes>
          <Route path="/" element={
            <PublicRoute><Landing /></PublicRoute>
          } />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}