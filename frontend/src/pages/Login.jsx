import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const data = res.data
      login(data.user, data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[#E9DFFF] relative overflow-hidden items-center justify-center border-r border-[#C9B8E8]">
        <div className="relative z-10 text-center px-12">
          <div className="w-16 h-16 rounded-2xl bg-[#9B7EDB] flex items-center justify-center mx-auto mb-6 shadow-md">
            <span className="text-white font-extrabold text-2xl">SS</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#493A63] mb-4">Welcome back to StudySphere</h2>
          <p className="text-[#776B88] font-bold text-base">Where campus students study together and achieve goals.</p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="flex -space-x-3">
              {['AK', 'RS', 'RP', 'KM'].map((initials, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-white border border-[#C9B8E8] flex items-center justify-center text-[#493A63] text-xs font-bold shadow-xs">
                  {initials}
                </div>
              ))}
            </div>
            <span className="text-[#493A63] font-bold text-xs">4 friends studying now</span>
          </div>
        </div>
      </div>


      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-lg">SS</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Sign in</h1>
          <p className="text-sm text-surface-500 mt-1 mb-6">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
            <Input label="Email" type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" variant="glow" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-sm text-center text-surface-500">
              Don't have an account? <Link to="/register" className="text-primary-600 hover:underline font-medium">Sign up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
