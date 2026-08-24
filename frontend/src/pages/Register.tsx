import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/register', { name, email, password });
      localStorage.setItem('token', data.token);
      navigate('/groups');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account">
      {error && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-100 text-red-600 p-3 mb-6 rounded-xl text-sm font-medium text-center shadow-inner"
        >
          {error}
        </motion.div>
      )}
      <form onSubmit={handleRegister} className="flex flex-col gap-6 text-gray-600">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full neu-pressed text-gray-600 placeholder-gray-400 px-4 py-3 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all bg-transparent"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Full Name"
          />
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            className="w-full neu-pressed text-gray-600 placeholder-gray-400 px-4 py-3 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all bg-transparent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email Address"
          />
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="password"
            className="w-full neu-pressed text-gray-600 placeholder-gray-400 px-4 py-3 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all bg-transparent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Password"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          className="group relative w-full flex justify-center py-3 px-4 neu-convex rounded-full text-sm font-bold text-blue-500 active:neu-pressed focus:outline-none transition-all mt-4 disabled:opacity-70"
        >
          {isLoading ? (
            'Creating...'
          ) : (
            <span className="flex items-center gap-2">
              Sign Up <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-500 font-medium">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-blue-500 hover:underline transition-colors">
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
