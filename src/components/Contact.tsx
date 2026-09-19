import { useEffect, useRef } from 'react';
import { asset, identity, resumePath } from '@/content/profile';
import { contact } from '@/content/site';
import { gsap, reducedMotion } from '@/lib/motion';
import { scrollToTop } from '@/lib/scroll-store';
import { Doodle } from './Doodle';
import { Underline } from './Marks';
import { Img } from './Img';
import { Section } from './Section';

const PATH = 'M10 150 C 180 40, 360 250, 560 120 S 900 20, 1180 110';

export function Contact() {
  const root = useRef<HTMLDivElement>(null);

  // The paper plane follows the dotted path as the last section scrolls in.
  useEffect(() => {
    const el = root.current;
    if (!el || reducedMotion()) return;
    const plane = el.querySelector('[data-plane]');
    const path = el.querySelector('[data-path]');
    if (!plane || !path) return;
    const tween = gsap.to(plane, {
      motionPath: { path: path as SVGPathElement, align: path as SVGPathElement, alignOrigin: [0.5, 0.5], autoRotate: 12 },
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 90%', end: 'bottom bottom', scrub: 1.2 },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <div ref={root} className="relative">
      <Section id="contact" idx={contact.idx} title={contact.title} pen={contact.pen} className="pt-24 md:pt-32">
        <div className="relative">
          <svg className="pointer-events-none absolute -top-16 left-0 hidden w-full md:block" viewBox="0 0 1200 260" fill="none" aria-hidden>
            <path data-path d={PATH} stroke="rgba(29,26,22,0.35)" strokeWidth={1.6} strokeDasharray="2 9" strokeLinecap="round" />
          </svg>
          <Img
            fallback={null}
            data-plane
            src={asset('doodles/plane.webp')}
            alt=""
            aria-hidden
            className="doodle absolute left-0 top-0 hidden w-[72px] md:block"
          />

          <a href={`mailto:${identity.email}`} className="h3 reveal relative mt-4 inline-block break-words text-[clamp(1.2rem,3.6vw,3.2rem)] text-ink hover:text-red md:mt-16">
            {identity.email}
            <Underline className="absolute -bottom-2 left-0 h-[0.32em] w-full overflow-visible" />
          </a>
          <p className="prose reveal mt-6 max-w-[34rem] text-[1.12rem]">{contact.text}</p>
          <div className="reveal mt-7 flex flex-wrap gap-3">
            <a href={identity.github} target="_blank" rel="noreferrer" className="box">
              github
            </a>
            <a href={identity.linkedin} target="_blank" rel="noreferrer" className="box">
              linkedin
            </a>
            <a href={identity.x} target="_blank" rel="noreferrer" className="box">
              x, @{identity.handle}
            </a>
            <a href={asset(resumePath)} target="_blank" rel="noreferrer" className="box is-red">
              {contact.resume}
            </a>
          </div>
        </div>

        <footer className="mt-24 flex flex-col gap-4 border-t border-dashed border-ink/25 pb-8 pt-6 type text-[0.9rem] text-ink-2 md:mt-32 md:flex-row md:items-center md:justify-between">
          <span>{contact.footer}</span>
          <button
            type="button"
            onClick={scrollToTop}
            className="hand flex items-center gap-2 self-start text-[1.35rem] text-ink hover:text-red md:self-auto"
          >
            back to the top
            <Doodle name="arrow" width={40} className="-rotate-[100deg]" />
          </button>
        </footer>
      </Section>
    </div>
  );
}
