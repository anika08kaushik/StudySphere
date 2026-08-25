import { motion } from 'motion/react'

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function Stagger({ children, className = '', staggerDelay, ...props }) {
  const variants = staggerDelay
    ? {
        ...container,
        visible: {
          ...container.visible,
          transition: { ...container.visible.transition, staggerChildren: staggerDelay },
        },
      }
    : container

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '', ...props }) {
  return (
    <motion.div variants={item} className={className} {...props}>
      {children}
    </motion.div>
  )
}
