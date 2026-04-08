import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetails from './pages/ProjectDetails'
import TestCases from './pages/TestCases'
import TestCaseDetails from './pages/TestCaseDetails'
import DefectTracker from './pages/DefectTracker'
import DefectDetails from './pages/DefectDetails'
import TestingOverview from './pages/TestingOverview'
import Navbar from './components/Navbar'

// ── Full-screen loading spinner shown while Supabase data loads ──────────────
const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-500 font-medium">Loading your workspace…</p>
    </div>
  </div>
)

const App = () => {
  const { user, loading } = useApp()

  if (!user) {
    return (
      <Routes>
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="*"       element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Routes>
          <Route path="/"                  element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"         element={<Dashboard />} />
          <Route path="/projects"          element={<Projects />} />
          <Route path="/projects/:id"      element={<ProjectDetails />} />
          <Route path="/test-cases"        element={<TestCases />} />
          <Route path="/test-cases/:id"    element={<TestCaseDetails />} />
          <Route path="/defects"           element={<DefectTracker />} />
          <Route path="/defects/:id"       element={<DefectDetails />} />
          <Route path="/testing-overview"  element={<TestingOverview />} />
          <Route path="*"                  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
