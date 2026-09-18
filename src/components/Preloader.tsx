import { useEffect, useRef, useState } from 'react';
import { nameBox, nameGlyphs } from '@/content/name-path';
import { asset } from '@/content/profile';
import { loader } from '@/content/site';
import { gsap, reducedMotion } from '@/lib/motion';

const preloadList = [
  'doodles/coffee.webp',
  'doodles/sparkle.webp',
  'doodles/plant.webp',
  'doodles/bubble.webp',
  'doodles/arrow.webp',
];

function loadImage(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

/** Fonts and the first screen's images, with a cap so a slow network never blocks the site. */
function whenAssetsReady() {
  const work = Promise.all([document.fonts.ready.then(() => undefined), ...preloadList.map((p) => loadImage(asset(p)))]);
  const cap = new Promise<void>((resolve) => setTimeout(resolve, 5000));
  return Promise.race([work.then(() => undefined), cap]);
}

type Props = { onReveal: () => void; onDone: () => void };

/**
 * The name gets written letter by letter while the counter runs. When the assets are in and the
 * writing is finished, the whole sheet lifts away from the top edge like a page being turned.
 */
export function Preloader({ onReveal, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const line = useRef<SVGPathElement>(null);
  const [count, setCount] = useState(0);
  const [label, setLabel] = useState(loader.status);

  useEffect(() => {
    const el = root.current;
    const letters = svg.current ? Array.from(svg.current.querySelectorAll('path')) : [];
    if (!el) return;

    const reduced = reducedMotion();
    const counter = { v: 0 };
    let cancelled = false;
    const ctx = gsap.context(() => {
      const write = gsap.timeline({ paused: true });
      if (reduced) {
        gsap.set(letters, { strokeDashoffset: 0, fill: 'var(--color-ink)' });
        write.to(counter, { v: 100, duration: 0.6, ease: 'none', onUpdate: () => setCount(Math.round(counter.v)) });
      } else {
        gsap.set(letters, { strokeDasharray: 1, strokeDashoffset: 1 });
        write
          .to(letters, { strokeDashoffset: 0, duration: 0.34, ease: 'power1.inOut', stagger: 0.13 }, 0)
          .to(letters, { fill: 'var(--color-ink)', duration: 0.6, ease: 'power2.out', stagger: 0.03 }, '-=0.5')
          .to(counter, { v: 100, duration: 2.7, ease: 'power1.inOut', onUpdate: () => setCount(Math.round(counter.v)) }, 0);
        if (line.current) {
          gsap.set(line.current, { strokeDasharray: 1, strokeDashoffset: 1 });
          write.to(line.current, { strokeDashoffset: 0, duration: 2.7, ease: 'power1.inOut' }, 0);
        }
      }

      write.play();
      const ready = Promise.all([whenAssetsReady(), new Promise<void>((resolve) => write.eventCallback('onComplete', () => resolve()))]);

      ready.then(() => {
        if (cancelled) return;
        setLabel(loader.ready);
        const exit = gsap.timeline({ delay: reduced ? 0.1 : 0.35, onComplete: onDone });
        if (reduced) {
          exit.call(onReveal).to(el, { autoAlpha: 0, duration: 0.4 });
        } else {
          exit
            .to(el, { rotateX: -92, transformPerspective: 1400, transformOrigin: '50% 0%', duration: 1.25, ease: 'power3.inOut' })
            .to(el, { boxShadow: '0 60px 90px rgba(0,0,0,0.35)', duration: 0.5 }, 0)
            .call(onReveal, [], 0.45)
            .set(el, { autoAlpha: 0 });
        }
      });
    }, el);

    return () => {
      cancelled = true;
      ctx.revert();
    };
  }, [onDone, onReveal]);

  const pad = 8;
  const viewBox = `${-pad} ${-nameBox.ascent} ${nameBox.width + pad * 2} ${nameBox.ascent + nameBox.descent}`;

  return (
    <div ref={root} className="loader" aria-label="Loading">
      <span className="sr-only" role="status">
        {label}
      </span>
      <div className="w-[min(72vw,560px)]">
        <svg ref={svg} className="name block w-full overflow-visible" viewBox={viewBox} aria-hidden>
          {nameGlyphs.map((d, i) => (
            <path key={i} d={d} pathLength={1} />
          ))}
        </svg>
        <div className="mt-8 flex items-center gap-4">
          <svg className="h-3 flex-1 overflow-visible" viewBox="0 0 400 12" preserveAspectRatio="none" aria-hidden>
            <path
              ref={line}
              pathLength={1}
              d="M2 7 C 60 3, 120 10, 200 6 S 340 4, 398 7"
              fill="none"
              stroke="var(--color-red)"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          </svg>
          <span className="type text-ink-2 tabular-nums w-[8.5ch] text-right" aria-hidden>
            {label} {String(count).padStart(2, '0')}
          </span>
        </div>
      </div>
      <span className="type absolute bottom-6 left-6 text-pencil text-[0.85rem]">portfolio, 2026</span>
      <span className="type absolute bottom-6 right-6 text-pencil text-[0.85rem]">gujarat, india</span>
    </div>
  );
}
