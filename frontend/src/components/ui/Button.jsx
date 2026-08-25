import { motion } from 'motion/react'

export default function Button({ children, variant = 'primary', size = 'md', icon, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-white/10 text-white/80 hover:bg-white/15 focus:ring-white/30 border border-white/15',
    ghost: 'text-white/50 hover:bg-white/5 hover:text-white/80 focus:ring-white/30',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    glow: 'bg-gradient-to-r from-primary-500 to-aurora-cyan text-white focus:ring-primary-500 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50',
    aurora: 'bg-gradient-to-r from-primary-500 via-aurora-cyan to-primary-500 bg-[length:200%_100%] text-white focus:ring-primary-500 shadow-lg shadow-primary-500/30 hover:bg-[length:100%_100%] transition-all duration-500',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const iconOnly = icon && !children

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`${base} ${variants[variant]} ${iconOnly ? 'p-2 rounded-full' : sizes[size]} ${className}`}
      {...props}
    >
      {icon && !iconOnly && <span className="mr-2">{icon}</span>}
      {iconOnly ? icon : children}
    </motion.button>
  )
}
