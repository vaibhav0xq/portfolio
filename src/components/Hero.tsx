import { useEffect, useRef } from 'react';
import { hero } from '@/content/site';
import { gsap, reducedMotion } from '@/lib/motion';
import { scrollToId } from '@/lib/scroll-store';
import { Doodle } from './Doodle';
import { Underline } from './Marks';
import { PrintFace } from './PrintFace';

export const PRINT_ANCHOR_ID = 'prints-anchor';

const prints = hero.prints;

/**
 * Static prints for phones and for browsers without WebGL. Same pages as the 3D ones. Phones get
 * the sketch and the note at a readable size; the code page needs the wider layout. On wide
 * screens they sit over the anchor until the 3D layer has painted, then they step aside.
 */
function PrintsFallback({ hidden }: { hidden: boolean }) {
  const [code, sketch, note] = prints;
  return (
    <div
      className={`relative z-[1] mx-auto mt-14 w-full max-w-[520px] md:absolute md:inset-x-0 md:top-1/2 md:mt-0 md:h-[440px] md:-translate-y-1/2 ${hidden ? 'md:hidden' : ''}`}
      aria-hidden
    >
      <figure className="print is-small m-0 hidden w-[52%] md:absolute md:left-0 md:top-[6%] md:block" style={{ transform: 'rotate(-3.5deg)', zIndex: 2 }}>
        <span className="tape tl" />
        <span className="tape tr" />
        <PrintFace item={code} />
        <figcaption className="cap">
          {code.caption} <span>{code.date}</span>
        </figcaption>
      </figure>
      <figure className="print is-small relative m-0 w-[78%] md:absolute md:right-0 md:top-0 md:w-[46%]" style={{ transform: 'rotate(-3deg)' }}>
        <span className="tape tc" />
        <PrintFace item={sketch} />
        <figcaption className="cap">
          {sketch.caption} <span>{sketch.date}</span>
        </figcaption>
      </figure>
      {/* In flow on phones, so the fallback is as tall as its prints. Absolute in the wide layout. */}
      <figure
        className="print is-small relative -mt-[6%] ml-auto w-[66%] md:absolute md:bottom-0 md:right-[2%] md:mt-0 md:w-[44%]"
        style={{ transform: 'rotate(2.5deg)', zIndex: 3 }}
      >
        <span className="tape tc" />
        <PrintFace item={note} />
        <figcaption className="cap">
          {note.caption} <span>{note.date}</span>
        </figcaption>
      </figure>
    </div>
  );
}

export function Hero({ revealed, printsLive }: { revealed: boolean; printsLive: boolean }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!revealed || !root.current) return;
    const nav = document.querySelector('[data-nav]');
    const navDraw = document.querySelectorAll('[data-nav] .draw');
    const ctx = gsap.context(() => {
      const reduced = reducedMotion();
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (reduced) {
        gsap.set([nav, '.reveal', '.line'], { autoAlpha: 1, yPercent: 0, y: 0 });
        gsap.set(['.draw', navDraw], { strokeDashoffset: 0 });
        gsap.set('.pop', { autoAlpha: 1, clipPath: 'none' });
        return;
      }
      tl.to(nav, { autoAlpha: 1, y: 0, duration: 0.8 }, 0)
        .fromTo('.status', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 0.1)
        .fromTo('.line', { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.09, ease: 'power4.out' }, 0.15)
        .fromTo('.h-mark .draw', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0.9)
        .fromTo(navDraw, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut' }, 0.6)
        .fromTo('.lede', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.7)
        .fromTo('.cta > *', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08 }, 0.9)
        .fromTo('.hero-note', { autoAlpha: 0, rotate: -6 }, { autoAlpha: 1, rotate: -2.5, duration: 0.7 }, 1.2)
        .fromTo('.strip', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 1.4)
        .fromTo(
          '.pop',
          { autoAlpha: 0, clipPath: 'inset(0 100% 0 0)', rotate: -5 },
          { autoAlpha: 1, clipPath: 'inset(0 0% 0 0)', rotate: 0, duration: 0.8, stagger: 0.12, ease: 'power2.out' },
          1.0,
        );
    }, root);
    return () => ctx.revert();
  }, [revealed]);

  return (
    <section ref={root} id="top" className="wrap relative" aria-label="Intro">
      <div className="grid items-center gap-10 pb-8 pt-4 md:min-h-[calc(100svh-10.5rem)] md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-12 md:pt-6">
        <div className="relative">
          <p className="status type mb-6 flex items-center gap-2.5 text-ink-2" style={{ opacity: 0 }}>
            <span className="inline-block size-2.5 rounded-full bg-red shadow-[0_0_0_4px_rgba(209,59,44,0.16)]" />
            {hero.status}
          </p>
          <h1 className="display text-[clamp(2.9rem,6.1vw,6.2rem)]">
            <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
              <span className="line block">{hero.titleLines[0]}</span>
            </span>
            <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
              <span className="line block">
                {hero.titleLines[1]} <em>{hero.titleEm}</em>
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
              <span className="line block">{hero.titleB}</span>
            </span>
            <span className="block overflow-hidden pb-[0.18em] -mb-[0.18em]">
              <span className="line block">
                <span className="h-mark relative inline-block whitespace-nowrap">
                  {hero.titleMark}
                  <Underline className="absolute -left-[0.1em] -bottom-[0.14em] h-[0.32em] overflow-visible" style={{ width: 'calc(100% + 0.2em)' }} />
                </span>
              </span>
            </span>
          </h1>
          <p className="lede prose mt-7 max-w-[34rem] text-[1.15rem] md:text-[1.22rem]" style={{ opacity: 0 }}>
            {hero.lede.before}
            <b>{hero.lede.org}</b>
            {hero.lede.after}
          </p>
          <div className="cta mt-8 flex flex-wrap gap-3.5">
            <a
              href="#projects"
              className="box is-red"
              style={{ opacity: 0 }}
              onClick={(e) => {
                e.preventDefault();
                scrollToId('projects');
              }}
            >
              {hero.primary}
            </a>
            <a
              href="#contact"
              className="box"
              style={{ opacity: 0 }}
              onClick={(e) => {
                e.preventDefault();
                scrollToId('contact');
              }}
            >
              {hero.secondary}
            </a>
          </div>
          <p className="hero-note note relative mt-7 ml-1 inline-block max-w-[20rem]" style={{ opacity: 0 }}>
            {hero.note}
            <Doodle name="arrow" width={64} className="absolute -right-[80px] top-0 rotate-[8deg]" />
          </p>
        </div>

        <div className="relative">
          <div id={PRINT_ANCHOR_ID} className="relative hidden h-[540px] w-full md:block" aria-hidden />
          <PrintsFallback hidden={printsLive} />
          <Doodle name="sparkle" width={58} className="pop absolute left-[30%] -top-6" />
          <Doodle name="coffee" width={64} className="pop absolute -left-6 bottom-10 -rotate-6" />
          <Doodle name="plant" width={78} className="pop absolute -right-2 bottom-[120px] hidden md:block" />
          <Doodle name="bubble" width={56} className="pop absolute left-[8%] -top-1 hidden md:block" />
        </div>
      </div>

      <div className="strip flex items-end justify-between pb-6 type text-ink-2" style={{ opacity: 0 }}>
        <span className="hand flex items-center gap-2 text-[1.4rem] text-ink">
          {hero.scroll}
          <Doodle name="arrow" width={40} className="rotate-[80deg]" />
        </span>
        <span className="flex items-center gap-2.5">
          <span className="inline-block size-[7px] rounded-full bg-red" />
          {hero.now}
        </span>
      </div>
    </section>
  );
}
