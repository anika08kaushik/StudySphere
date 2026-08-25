import { useEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'

export default function AnimatedCounter({ target, duration = 1.5, className = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return

    let start = 0
    const startTime = performance.now()

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
    }

    function tick(now) {
      const elapsed = (now - startTime) / (duration * 1000)
      const progress = Math.min(elapsed, 1)
      const eased = easeOutExpo(progress)
      const current = Math.round(eased * target)

      setCount(current)

      if (progress < 1) {
        start = requestAnimationFrame(tick)
      }
    }

    start = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(start)
  }, [isInView, target, duration])

  return (
    <span ref={ref} className={className}>
      {count.toLocaleString()}
    </span>
  )
}
