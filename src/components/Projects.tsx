import { useEffect, useRef, type CSSProperties } from 'react';
import { asset, earlierBuilds, products, type Product } from '@/content/profile';
import { projects } from '@/content/site';
import { animateOnScroll, gsap, ScrollTrigger } from '@/lib/motion';
import { Doodle } from './Doodle';
import { Img } from './Img';
import { Squiggle } from './Marks';

const tilts = [-2, 1.6, -1.4, 1.8];

function Print({ p, i }: { p: Product; i: number }) {
  const rot = tilts[i % tilts.length];
  return (
    <figure className="print tilt m-0" style={{ '--tilt': `${rot}deg` } as CSSProperties}>
      <span className="tape tl" />
      <span className="tape tr" />
      {p.image ? (
        <Img src={asset(p.image)} alt={p.imageAlt ?? p.name} width={p.imageSize?.[0]} height={p.imageSize?.[1]} loading="lazy" decoding="async" />
      ) : (
        <div className="grid aspect-[16/10] w-full place-items-center border border-dashed border-ink/40 bg-paper">
          <div className="flex flex-col items-center gap-3 px-8 text-center">
            <Doodle name="tools" width={64} />
            <span className="note text-[1.35rem] text-ink-2">{projects.noImage}</span>
          </div>
        </div>
      )}
      <figcaption className="cap">
        {p.name} <span>{p.period.toLowerCase()}</span>
      </figcaption>
    </figure>
  );
}

function Item({ p, i, total }: { p: Product; i: number; total: number }) {
  return (
    <article className="rail-card" data-card>
      <div className="grid items-center gap-8 md:grid-cols-[minmax(0,50%)_minmax(0,50%)] md:gap-12">
        <div className="px-3 md:px-4" data-print>
          <Print p={p} i={i} />
        </div>
        <div data-text>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="type text-pencil">
              {p.index} / {String(total).padStart(2, '0')}
            </span>
            <span className={`stamp !text-[0.8rem] !px-2.5 !py-1 ${p.status.startsWith('Live') ? '' : 'opacity-70'}`}>{p.status}</span>
          </div>
          <h3 className="h3 text-[2rem] md:text-[2.5rem]">{p.name}</h3>
          <p className="prose mt-2 text-[1.08rem]">{p.tagline}</p>
          <ul className="checks mt-4 text-[0.98rem]">
            {p.points.map((pt) => (
              <li key={pt}>{pt}</li>
            ))}
          </ul>
          <p className="type mt-4 text-[0.88rem] text-pencil">stack: {p.stack.toLowerCase()}</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {p.links.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="box is-small">
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export function Projects() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<SVGPathElement>(null);
  const total = products.length;

  useEffect(() => {
    const el = stage.current;
    const rail = track.current;
    if (!el || !rail) return;
    const mm = gsap.matchMedia();

    // Reduced motion gets the vertical list from the stylesheet instead of a pinned, scrubbed shelf.
    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      // The shelf ends with the last print at the same distance from the right edge as the first is from the left.
      const distance = () => {
        const left = rail.getBoundingClientRect().left - Number(gsap.getProperty(rail, 'x'));
        return Math.max(0, rail.scrollWidth + 2 * left - window.innerWidth);
      };
      const setProgress = (p: number) => {
        if (counter.current) counter.current.textContent = String(Math.round(p * (total - 1)) + 1).padStart(2, '0');
        if (bar.current) bar.current.style.strokeDashoffset = String(1 - p);
      };
      const tween = gsap.to(rail, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => setProgress(self.progress),
        },
      });
      setProgress(0);

      // Each shelf item settles in as it slides into view.
      const cards = Array.from(rail.querySelectorAll<HTMLElement>('[data-card]'));
      const triggers = cards.map((card, i) => {
        const print = card.querySelector('[data-print]');
        const text = card.querySelectorAll('[data-text] > *');
        if (i === 0) return null;
        gsap.set(print, { autoAlpha: 0, y: 40, rotate: 3 });
        gsap.set(text, { autoAlpha: 0, y: 18 });
        return ScrollTrigger.create({
          trigger: card,
          containerAnimation: tween,
          start: 'left 80%',
          once: true,
          onEnter: () => {
            gsap.to(print, { autoAlpha: 1, y: 0, rotate: 0, duration: 0.9, ease: 'power3.out' });
            gsap.to(text, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.07, delay: 0.1 });
          },
        });
      });
      return () => {
        triggers.forEach((t) => t?.kill());
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    const cleanup = animateOnScroll(root.current ?? el);
    return () => {
      cleanup();
      mm.revert();
    };
  }, [total]);

  return (
    <div ref={root}>
      <section ref={stage} id="projects" className="relative overflow-x-clip pt-20 md:flex md:min-h-svh md:flex-col md:justify-center md:pt-0" aria-label={projects.title}>
        <div className="wrap">
          <div className="sec-head !mb-8">
            <span className="idx reveal">{projects.idx}</span>
            <h2 className="h2 reveal">{projects.title}</h2>
            <span className="pen reveal">{projects.pen}</span>
          </div>
        </div>
        <div className="wrap">
          <div ref={track} className="rail-track reveal">
            {products.map((p, i) => (
              <Item key={p.name} p={p} i={i} total={total} />
            ))}
          </div>
        </div>
        <div className="wrap mt-10 hidden items-center gap-6 md:flex motion-reduce:!hidden">
          <span className="type text-pencil">{projects.hint}</span>
          <svg className="h-3 flex-1 overflow-visible" viewBox="0 0 600 12" preserveAspectRatio="none" aria-hidden>
            <path d="M2 7 C 100 3, 200 10, 300 6 S 500 4, 598 7" fill="none" stroke="rgba(29,26,22,0.18)" strokeWidth={2} strokeLinecap="round" />
            <path ref={bar} pathLength={1} d="M2 7 C 100 3, 200 10, 300 6 S 500 4, 598 7" fill="none" stroke="var(--color-red)" strokeWidth={2.4} strokeLinecap="round" style={{ strokeDasharray: 1, strokeDashoffset: 1 }} />
          </svg>
          <span className="type tabular-nums text-ink-2">
            <span ref={counter}>01</span> / {String(total).padStart(2, '0')}
          </span>
        </div>
      </section>

      <div className="wrap mt-16 md:mt-24" aria-label={projects.earlierTitle}>
        <div className="card alt reveal flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:gap-10 md:px-8">
          <div>
            <h3 className="h3 text-[1.4rem]">{projects.earlierTitle}</h3>
            <p className="prose mt-1 text-[1rem]">{projects.earlierText}</p>
          </div>
          <ul className="type m-0 flex list-none flex-col gap-1.5 p-0 text-ink-2 md:ml-auto">
            {earlierBuilds.map((b) => (
              <li key={b.name}>
                <b className="font-normal text-ink">{b.name}</b>, {b.what}
              </li>
            ))}
          </ul>
          <Squiggle className="hidden md:block" width={90} />
        </div>
      </div>
    </div>
  );
}
