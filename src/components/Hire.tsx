import { useEffect, useRef } from 'react';
import { hire } from '@/content/site';
import { gsap, reducedMotion, ScrollTrigger } from '@/lib/motion';
import { Doodle } from './Doodle';
import { Check } from './Marks';
import { Section } from './Section';

export function Hire() {
  const stamp = useRef<HTMLSpanElement>(null);

  // The stamp comes down onto the page once the roles line is in view.
  useEffect(() => {
    const el = stamp.current;
    if (!el) return;
    if (reducedMotion()) {
      gsap.set(el, { autoAlpha: 1 });
      return;
    }
    gsap.set(el, { autoAlpha: 0, scale: 1.9, rotate: -14 });
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(el, { autoAlpha: 1, scale: 1, rotate: -6, duration: 0.45, ease: 'power4.in' });
        gsap.to(el, { scale: 1.04, duration: 0.12, delay: 0.45, yoyo: true, repeat: 1, ease: 'power1.out' });
      },
    });
    return () => st.kill();
  }, []);

  return (
    <Section id="hire" idx={hire.idx} title={hire.title} pen={hire.pen} className="pt-24 md:pt-32">
      <div className="grid gap-5 md:grid-cols-2 md:gap-6">
        {hire.reasons.map((r, i) => (
          <article key={r.n} className={`card reveal relative px-6 py-6 md:px-8 md:py-7 ${i % 2 ? 'alt' : ''}`}>
            <div className="flex items-start gap-4">
              <Check className="mt-1.5 shrink-0" width={28} />
              <div>
                <span className="type text-pencil">{r.n}</span>
                <h3 className="h3 mt-1 text-[1.5rem] md:text-[1.7rem]">{r.title}</h3>
                <p className="prose mt-2.5 text-[1.04rem]">{r.text}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="relative mt-12 flex flex-col items-start gap-6 md:mt-16 md:flex-row md:items-center md:gap-10">
        <p className="prose reveal max-w-[44rem] text-[1.12rem] md:text-[1.2rem]">{hire.roles}</p>
        <span ref={stamp} className="stamp shrink-0 md:ml-auto" style={{ opacity: 0 }}>
          {hire.stamp}
        </span>
      </div>
      <Doodle name="shield" width={60} className="pop absolute top-4 right-[8%] hidden rotate-[10deg] lg:block" />
      <Doodle name="chain" width={80} className="pop absolute bottom-[-30px] left-[45%] hidden lg:block" />
    </Section>
  );
}
