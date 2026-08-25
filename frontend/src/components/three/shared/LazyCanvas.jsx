import { lazy, Suspense } from 'react'
import SceneErrorBoundary from '../../shared/SceneErrorBoundary'

const SceneContainer = lazy(() => import('../SceneContainer'))

function CanvasFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/30 to-aurora-cyan/30 flex items-center justify-center animate-pulse">
          <span className="text-white/80 font-bold text-sm">SS</span>
        </div>
        <p className="text-white/40 text-xs font-medium tracking-wider uppercase">Loading environment...</p>
      </div>
    </div>
  )
}

function isMobile() {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

export default function LazyCanvas({
  children,
  camera = [0, 3, 6],
  fov = 50,
  className = '',
  mobileFallback = null,
  dpr,
  ...rest
}) {
  if (isMobile() && mobileFallback) {
    return mobileFallback
  }

  return (
    <div className={`absolute inset-0 ${className}`}>
      <SceneErrorBoundary fallback={<CanvasFallback />}>
        <Suspense fallback={<CanvasFallback />}>
          <SceneContainer
            camera={camera}
            fov={fov}
            dpr={dpr}
            {...rest}
          >
            {children}
          </SceneContainer>
        </Suspense>
      </SceneErrorBoundary>
    </div>
  )
}
