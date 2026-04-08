import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, User, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import toast from 'react-hot-toast'

const Login = () => {
  const { login } = useApp()
  const navigate  = useNavigate()

  const [name,     setName]     = useState('')
  const [username, setUsername] = useState('')
  const [error,    setError]    = useState('')
  const [busy,     setBusy]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !username.trim()) {
      setError('Invalid name or username.')
      return
    }

    setBusy(true)
    const result = await login(name.trim(), username.trim())
    setBusy(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    toast.success(`Welcome back, ${name.trim()}!`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/80 to-secondary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4"
          >
            <User className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-primary mb-1">NuAig.Ai</h1>
          <p className="text-gray-500 text-sm">Sign in to your account</p>
        </div>

        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              className="input-field"
              placeholder="Enter your full name"
              autoComplete="name"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              className="input-field"
              placeholder="Enter your username"
              autoComplete="username"
            />
          </div>

          <motion.button
            type="submit"
            disabled={busy}
            whileHover={busy ? {} : { scale: 1.02 }}
            whileTap={busy ? {} : { scale: 0.98 }}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy
              ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <LogIn className="w-5 h-5" />
            }
            {busy ? 'Signing in…' : 'Sign In'}
          </motion.button>
        </form>

        {/* Sign up link */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-primary font-semibold hover:underline focus:outline-none"
            >
              Sign Up
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
