import { motion } from 'motion/react'

export default function LoadingSkeleton() {
  return (
    <div className="fixed inset-0 flex items-center justify-center aurora-bg">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-aurora-cyan flex items-center justify-center"
          animate={{
            boxShadow: [
              '0 0 20px rgba(124, 58, 237, 0.3)',
              '0 0 40px rgba(124, 58, 237, 0.5), 0 0 80px rgba(6, 182, 212, 0.2)',
              '0 0 20px rgba(124, 58, 237, 0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-white font-bold text-xl">SS</span>
        </motion.div>
        <motion.p
          className="text-white/60 text-sm font-medium tracking-wider uppercase"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading...
        </motion.p>
      </div>
    </div>
  )
}
