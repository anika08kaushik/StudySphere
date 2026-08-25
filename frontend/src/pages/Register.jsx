import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', semester: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Registration failed')
      navigate('/login')
    } catch {
      login({ _id: 'u1', name: form.name, email: form.email, department: form.department, semester: Number(form.semester), skills: [], isOnline: true, status: 'online', focusStreak: 0, totalFocusMinutes: 0 }, 'demo-token')
      navigate('/dashboard')
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
          <h2 className="text-3xl font-extrabold text-[#493A63] mb-4">Start your study journey</h2>
          <p className="text-[#776B88] font-bold text-base">Join thousands of students collaborating and focusing together.</p>
        </div>
      </div>


      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-lg">SS</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Create your account</h1>
          <p className="text-sm text-surface-500 mt-1 mb-6">Join StudySphere and start collaborating</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
            <Input label="Full Name" name="name" placeholder="Anika Kaushik" value={form.name} onChange={handleChange} required />
            <Input label="Email" name="email" type="email" placeholder="you@university.edu" value={form.email} onChange={handleChange} required />
            <Input label="Password" name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Department" name="department" placeholder="Computer Science" value={form.department} onChange={handleChange} />
              <Input label="Semester" name="semester" type="number" placeholder="6" value={form.semester} onChange={handleChange} />
            </div>
            <Button type="submit" variant="glow" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
            <p className="text-sm text-center text-surface-500">
              Already have an account? <Link to="/login" className="text-primary-600 hover:underline font-medium">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
