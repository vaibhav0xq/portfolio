import type Lenis from 'lenis';

// One place for the Lenis instance so nav links and buttons can scroll without prop drilling.
let lenis: Lenis | null = null;

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

// Every overlay that holds the page still (preloader, menu, lightbox) takes its own lock. Scrolling
// resumes only when the last one lets go, so one overlay closing under another cannot unfreeze it.
const locks = new Set<symbol>();

/** Freezes wheel, touch and programmatic scrolling. Lenis adds `lenis-stopped` to <html>. Returns an idempotent release. */
export function lockScroll() {
  const token = Symbol('scroll-lock');
  locks.add(token);
  lenis?.stop();
  return () => {
    if (!locks.delete(token)) return;
    if (locks.size === 0) lenis?.start();
  };
}

// `force` lets a menu link scroll even though the menu is still holding the page still.
export function scrollToId(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4, force: true });
  else target.scrollIntoView({ behavior: 'smooth' });
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { duration: 1.6, force: true });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}
