import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

export { gsap, ScrollTrigger };

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isDesktop = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches;

/** Smooth scrolling driven by the GSAP ticker so ScrollTrigger and Lenis share one clock. */
export function createSmoothScroll() {
  const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return {
    lenis,
    destroy() {
      gsap.ticker.remove(tick);
      lenis.destroy();
    },
  };
}

/**
 * Wires every .reveal, .draw and .pop inside a root so each one animates when it reaches the
 * viewport. Elements that arrive in the same frame stagger together. Returns a cleanup.
 */
export function animateOnScroll(root: Element) {
  const reveals = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));
  const draws = Array.from(root.querySelectorAll<SVGElement>('.draw'));
  const pops = Array.from(root.querySelectorAll<HTMLElement>('.pop'));

  if (reducedMotion()) {
    if (reveals.length) gsap.set(reveals, { autoAlpha: 1 });
    if (draws.length) gsap.set(draws, { strokeDashoffset: 0 });
    if (pops.length) gsap.set(pops, { autoAlpha: 1, clipPath: 'none' });
    return () => {};
  }

  if (reveals.length) gsap.set(reveals, { autoAlpha: 0, y: 22 });
  if (draws.length) gsap.set(draws, { strokeDashoffset: 1 });
  if (pops.length) gsap.set(pops, { autoAlpha: 0, clipPath: 'inset(0 100% 0 0)', rotate: -4 });

  const triggers = [
    ...ScrollTrigger.batch(reveals, {
      start: 'top 86%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08}),
    }),
    ...ScrollTrigger.batch(draws, {
      start: 'top 82%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.15, delay: 0.35}),
    }),
    ...ScrollTrigger.batch(pops, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, { autoAlpha: 1, clipPath: 'inset(0 0% 0 0)', rotate: 0, duration: 0.9, ease: 'power2.out', stagger: 0.12, delay: 0.2}),
    }),
  ];
  return () => triggers.forEach((t) => t.kill());
}
