import { motion } from 'motion/react'

const directions = {
  up: { y: 30, x: 0 },
  down: { y: -30, x: 0 },
  left: { x: 30, y: 0 },
  right: { x: -30, y: 0 },
}

export default function FadeIn({
  children,
  delay = 0,
  direction = 'up',
  duration = 0.5,
  blur = false,
  className = '',
  ...props
}) {
  const offset = directions[direction] || directions.up

  return (
    <motion.div
      initial={{ opacity: 0, ...offset, filter: blur ? 'blur(8px)' : 'blur(0px)' }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}
