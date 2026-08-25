import { lazy, Suspense, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import Button from '../components/ui/Button'
import FadeIn from '../components/motion/FadeIn'
import AnimatedCounter from '../components/motion/AnimatedCounter'
import TiltCard from '../components/motion/TiltCard'
import Stagger, { StaggerItem } from '../components/motion/Stagger'
import SceneErrorBoundary from '../components/shared/SceneErrorBoundary'

const SceneContainer = lazy(() => import('../components/three/SceneContainer'))
const ParticleField = lazy(() => import('../components/three/ParticleField'))
const FloatingObjects = lazy(() => import('../components/three/FloatingObjects'))

const studentNodes = [
  { name: 'AK', x: '18%', y: '28%', delay: 0 },
  { name: 'RS', x: '78%', y: '22%', delay: 0.5 },
  { name: 'RP', x: '12%', y: '65%', delay: 1 },
  { name: 'KM', x: '82%', y: '60%', delay: 1.5 },
]

const features = [
  {
    title: 'Study Groups',
    desc: 'Create and join groups for every subject. Collaborate in real-time with shared notes, resources, and focus sessions.',
    gradient: 'from-purple-100 to-indigo-50',
    border: 'border-[#E8E0F2]',
    icon: '👥',
  },
  {
    title: '3D Focus Room',
    desc: 'Study together in a cozy interactive 3D library with live timers, seat selection, and avatar walking animations.',
    gradient: 'from-amber-100 to-orange-50',
    border: 'border-[#F6EBD0]',
    icon: '📚',
  },
  {
    title: 'Resource Locker',
    desc: 'Share files securely with watermarking and folder organization. Your study materials stay safe and organized.',
    gradient: 'from-emerald-100 to-teal-50',
    border: 'border-[#D9E8DC]',
    icon: '📁',
  },
]

function HeroScene({ mouse }) {
  return (
    <SceneErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <SceneContainer camera={[0, 0, 6]} fov={50}>
          <ParticleField count={100} mouse={mouse} />
          <FloatingObjects mouse={mouse} />
        </SceneContainer>
      </Suspense>
    </SceneErrorBoundary>
  )
}

export default function Home() {
  const mouseRef = useRef({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2
    const y = (e.clientY / window.innerHeight - 0.5) * 2
    mouseRef.current = { x, y }
  }

  return (
    <div className="min-h-screen bg-[#F8F5FF] text-[#271C38] overflow-hidden" onMouseMove={handleMouseMove}>
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #E9DFFF 0%, transparent 70%)',
            top: '-10%',
            left: '-10%',
          }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 flex items-center justify-between px-6 md:px-10 py-5 bg-white/90 backdrop-blur-md border-b border-[#E8E0F2]"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#7A58C1] flex items-center justify-center shadow-xs">
            <span className="text-white font-extrabold text-sm">SS</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-[#271C38]">StudySphere</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <button className="px-4 py-2 text-xs font-bold text-[#271C38] hover:text-[#7A58C1] hover:bg-[#F8F5FF] rounded-xl transition-colors">
              Log in
            </button>
          </Link>
          <Link to="/register">
            <button className="px-5 py-2 rounded-xl bg-[#7A58C1] hover:bg-[#6442A8] text-white font-bold text-xs shadow-xs transition-all">
              Get Started
            </button>
          </Link>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative z-10 min-h-[85vh] flex flex-col items-center justify-center px-6">
        {/* 3D Scene - subtle background */}
        <div className="absolute inset-0 hidden md:block opacity-15 pointer-events-none">
          <HeroScene mouse={mouseRef} />
        </div>

        {/* Mobile floating nodes */}
        <div className="absolute inset-0 md:hidden opacity-80">
          {studentNodes.map((node, i) => (
            <motion.div
              key={i}
              className="absolute w-10 h-10 rounded-full flex items-center justify-center text-xs font-extrabold shadow-sm bg-[#7A58C1] text-white border border-[#9B7EDB]"
              style={{
                left: node.x,
                top: node.y,
              }}
              animate={{
                y: [0, -15, 0],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: node.delay,
              }}
            >
              {node.name}
            </motion.div>
          ))}
        </div>

        {/* Floating student nodes (desktop) - Purple boxes with white text */}
        {studentNodes.map((node, i) => (
          <motion.div
            key={i}
            className="absolute z-10 hidden md:flex items-center justify-center"
            style={{ left: node.x, top: node.y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: [0, -10, 0],
            }}
            transition={{
              opacity: { delay: 0.8 + node.delay, duration: 0.5 },
              scale: { delay: 0.8 + node.delay, duration: 0.5, type: 'spring' },
              y: { delay: 1.5 + node.delay, duration: 4 + i, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black bg-[#7A58C1] text-white shadow-md border border-[#9B7EDB]">
              {node.name}
            </div>
          </motion.div>
        ))}


        {/* Hero Text */}
        <div className="relative z-20 text-center max-w-3xl pt-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.98] mb-6">
              <span className="block text-[#271C38]">Study together.</span>
              <span className="block text-[#7A58C1]">Focus deeper.</span>
              <span className="block text-[#4D3F61]">Achieve more.</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-base md:text-lg text-[#4D3F61] font-bold max-w-xl mx-auto mb-10"
          >
            The playful digital campus & 3D virtual library built for students who want to study together and achieve more.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="flex items-center justify-center gap-4"
          >
            <Link to="/register">
              <button className="px-8 py-3.5 rounded-2xl bg-[#7A58C1] hover:bg-[#6442A8] text-white font-extrabold text-sm shadow-md transition-all">
                Enter Digital Campus
              </button>
            </Link>
            <Link to="/login">
              <button className="px-8 py-3.5 rounded-2xl bg-white border border-[#C9B8E8] text-[#271C38] font-extrabold text-sm hover:bg-[#E9DFFF] transition-all shadow-xs">
                Student Sign In
              </button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="flex items-center justify-center gap-6 mt-14"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['AK', 'RS', 'RP'].map((initials, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-[#E9DFFF] border border-[#C9B8E8] flex items-center justify-center text-[10px] font-black text-[#271C38]"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <span className="text-xs text-[#4D3F61] font-extrabold">
                <AnimatedCounter target={2400} className="text-[#271C38] font-black" />+ active students
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-extrabold text-[#4D3F61]">
              <span>⭐ 4.9 rating</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20 px-6 md:px-10">
        <FadeIn className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black text-[#271C38] mb-3">
            Everything you need to <span className="text-[#7A58C1]">study together</span>
          </h2>
          <p className="text-[#4D3F61] text-sm font-bold max-w-xl mx-auto">
            A complete playful study ecosystem designed for how campus students learn.
          </p>
        </FadeIn>

        <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto" staggerDelay={0.15}>
          {features.map((f) => (
            <StaggerItem key={f.title}>
              <TiltCard>
                <div className={`card-soft p-8 h-full bg-white border ${f.border} shadow-xs`}>
                  <div className="w-12 h-12 rounded-2xl bg-[#F8F5FF] border border-[#E8E0F2] flex items-center justify-center text-2xl mb-5">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-black text-[#271C38] mb-2">{f.title}</h3>
                  <p className="text-[#4D3F61] text-xs font-bold leading-relaxed">{f.desc}</p>
                </div>
              </TiltCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Social Proof */}
      <section className="relative z-10 py-16 px-6 md:px-10">
        <FadeIn className="text-center max-w-3xl mx-auto card-soft p-10 bg-white border-[#E8E0F2]">
          <h2 className="text-2xl md:text-3xl font-black text-[#271C38] mb-3">
            Join <AnimatedCounter target={2400} className="text-[#7A58C1]" />+ campus students
          </h2>
          <p className="text-[#4D3F61] text-xs font-bold max-w-md mx-auto mb-6">
            StudySphere is where students come to focus, collaborate, and achieve their academic goals together.
          </p>
          <Link to="/register">
            <button className="px-8 py-3.5 rounded-2xl bg-[#7A58C1] hover:bg-[#6442A8] text-white font-extrabold text-xs shadow-xs transition-all">
              Start Your Study Journey
            </button>
          </Link>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#E8E0F2] bg-white py-6 px-6 md:px-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#7A58C1] flex items-center justify-center">
              <span className="text-white font-bold text-xs">SS</span>
            </div>
            <span className="text-xs font-black text-[#271C38]">StudySphere</span>
          </div>
          <p className="text-xs text-[#4D3F61] font-bold">Built for students, by students.</p>
        </div>
      </footer>
    </div>
  )
}
