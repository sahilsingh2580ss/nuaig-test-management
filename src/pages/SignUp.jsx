import { useState } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import toast from 'react-hot-toast'

const USERNAME_RE = /^[a-zA-Z0-9]+$/

// ── Field must live OUTSIDE SignUp so React does not remount it on every
// render — defining a component inside another component causes React to
// treat it as a new type each render, which unmounts the input and drops focus.
const Field = ({ id, label, type = 'text', value, onChange, placeholder, autoComplete, hint, error }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
      {label} <span className="text-red-400">*</span>
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className={`input-field ${error ? 'border-red-400 focus:ring-red-400' : ''}`}
    />
    {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    {error && (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />{error}
      </p>
    )}
  </div>
)

const SignUp = () => {
  const { signUp }  = useApp()
  const navigate    = useNavigate()

  const [form, setForm] = useState({
    firstName:   '',
    lastName:    '',
    username:    '',
    dateOfBirth: '',
    role:        '',
  })
  const [errors, setErrors] = useState({})
  const [busy,   setBusy]   = useState(false)

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  // ── Field-level validation ─────────────────────────────────────────────
  const validate = () => {
    const errs = {}
    if (!form.firstName.trim())   errs.firstName   = 'First name is required.'
    if (!form.lastName.trim())    errs.lastName    = 'Last name is required.'
    if (!form.username.trim())    errs.username    = 'Username is required.'
    else if (!USERNAME_RE.test(form.username))
                                  errs.username    = 'Username must be alphanumeric only (no spaces or symbols).'
    if (!form.dateOfBirth)        errs.dateOfBirth = 'Date of birth is required.'
    if (!form.role)               errs.role        = 'Please select a role.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setBusy(true)
    const result = await signUp({
      firstName:   form.firstName.trim(),
      lastName:    form.lastName.trim(),
      username:    form.username.trim(),
      dateOfBirth: form.dateOfBirth,
      role:        form.role,
    })
    setBusy(false)

    if (!result.ok) {
      // Username taken comes back as a username-level error
      setErrors({ username: result.error })
      return
    }

    toast.success('Account created! Please sign in.')
    navigate('/login')
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
            <UserPlus className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-primary mb-1">Create Account</h1>
          <p className="text-gray-500 text-sm">Fill in the details below to get started</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="firstName" label="First Name"
              value={form.firstName} onChange={set('firstName')}
              placeholder="First name" autoComplete="given-name"
              error={errors.firstName}
            />
            <Field
              id="lastName" label="Last Name"
              value={form.lastName} onChange={set('lastName')}
              placeholder="Last name" autoComplete="family-name"
              error={errors.lastName}
            />
          </div>

          <Field
            id="username" label="Username"
            value={form.username} onChange={set('username')}
            placeholder="e.g. johndoe123"
            autoComplete="username"
            hint="Alphanumeric only — no spaces or special characters."
            error={errors.username}
          />

          <Field
            id="dateOfBirth" label="Date of Birth"
            type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')}
            autoComplete="bday"
            error={errors.dateOfBirth}
          />

          {/* Role dropdown */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Role <span className="text-red-400">*</span>
            </label>
            <select
              id="role"
              value={form.role}
              onChange={set('role')}
              className={`input-field ${errors.role ? 'border-red-400 focus:ring-red-400' : ''}`}
            >
              <option value="">— Select a role —</option>
              <option value="Developer">Developer</option>
              <option value="Administration">Administration</option>
              <option value="QA">QA</option>
              <option value="Product Manager">Product Manager</option>
              <option value="Business Analyst">Business Analyst</option>
              <option value="Marketing">Marketing</option>
              <option value="Technical Program Manager">Technical Program Manager</option>
              <option value="Director of Engineering">Director of Engineering</option>
              <option value="CEO">CEO</option>
            </select>
            {errors.role && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.role}
              </p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={busy}
            whileHover={busy ? {} : { scale: 1.02 }}
            whileTap={busy ? {} : { scale: 0.98 }}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {busy
              ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <CheckCircle2 className="w-5 h-5" />
            }
            {busy ? 'Creating account…' : 'Sign Up'}
          </motion.button>
        </form>

        {/* Back to login */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline focus:outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default SignUp
