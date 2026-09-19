import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { About } from '@/components/About';
import { Contact } from '@/components/Contact';
import { ErrorBoundary } from '@/components/error-boundary';
import { Hero } from '@/components/Hero';
import { Hire } from '@/components/Hire';
import { Nav } from '@/components/Nav';
import { Preloader } from '@/components/Preloader';
import { Projects } from '@/components/Projects';
import { Work } from '@/components/Work';
import { createSmoothScroll, ScrollTrigger } from '@/lib/motion';
import { lockScroll, setLenis } from '@/lib/scroll-store';

// If WebGL fails the DOM prints stay in place, so the 3D layer just goes away.
function Quiet() {
  return null;
}

const PRINTS_MQ = '(min-width: 768px)';

const PrintsLayer = lazy(() => import('@/scene/Prints').then((m) => ({ default: m.PrintsLayer })));

// The 3D prints are an upgrade over the DOM prints. The DOM prints stay visible until the scene has
// painted its textures. They come back if WebGL is missing, throws or loses its context.
type PrintsState = 'loading' | 'live' | 'off';

// A quick probe so a browser without WebGL never downloads the 3D code or throws inside it.
function hasWebGL() {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export default function App() {
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prints, setPrints] = useState<PrintsState>(() => (hasWebGL() ? 'loading' : 'off'));
  // Phones get the DOM prints, so they never download the 3D code. Same breakpoint as the anchor.
  const [wide, setWide] = useState(() => window.matchMedia(PRINTS_MQ).matches);

  useEffect(() => {
    const mq = window.matchMedia(PRINTS_MQ);
    const update = () => setWide(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const smooth = createSmoothScroll();
    setLenis(smooth.lenis);
    return () => {
      setLenis(null);
      smooth.destroy();
    };
  }, []);

  // The page cannot scroll while the preloader is up. Once it is gone the layout is final, so
  // ScrollTrigger measures everything again.
  useEffect(() => {
    if (loading) return lockScroll();
    ScrollTrigger.refresh();
    return undefined;
  }, [loading]);

  // Late fonts or images (the preloader gives up waiting after a few seconds) can move things, so
  // measure again when they land.
  useEffect(() => {
    let alive = true;
    const refresh = () => {
      if (alive) ScrollTrigger.refresh();
    };
    document.fonts.ready.then(refresh);
    window.addEventListener('load', refresh);
    return () => {
      alive = false;
      window.removeEventListener('load', refresh);
    };
  }, []);

  const onReveal = useCallback(() => setRevealed(true), []);
  const onDone = useCallback(() => setLoading(false), []);
  const onPrintsReady = useCallback(() => setPrints('live'), []);
  const onPrintsFail = useCallback(() => setPrints('off'), []);

  const showScene = wide && prints !== 'off';

  return (
    <>
      <div className="sheet min-h-svh" inert={loading}>
        <Nav />
        <main>
          <Hero revealed={revealed} printsLive={showScene && prints === 'live'} />
          <About />
          <Work />
          <Projects />
          <Hire />
          <Contact />
        </main>
      </div>
      <div className="grain" aria-hidden />
      {showScene && (
        <ErrorBoundary FallbackComponent={Quiet} onError={onPrintsFail}>
          <Suspense fallback={null}>
            <PrintsLayer revealed={revealed} onReady={onPrintsReady} onFail={onPrintsFail} />
          </Suspense>
        </ErrorBoundary>
      )}
      {loading && <Preloader onReveal={onReveal} onDone={onDone} />}
    </>
  );
}
