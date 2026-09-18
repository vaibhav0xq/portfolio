import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { asset, identity, resumePath } from '@/content/profile';
import { contact, sections } from '@/content/site';
import { gsap, ScrollTrigger } from '@/lib/motion';
import { trapTab } from '@/lib/focus';
import { lockScroll, scrollToId, scrollToTop } from '@/lib/scroll-store';
import { ThinLine } from './Marks';

function useActiveSection() {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const triggers = sections.map((s) =>
      ScrollTrigger.create({
        trigger: `#${s.id}`,
        start: 'top 45%',
        end: 'bottom 45%',
        // Measured after the pinned project rail so the spacer it adds is counted.
        refreshPriority: -1,
        onToggle: (self) => {
          if (self.isActive) setActive(s.id);
          else setActive((cur) => (cur === s.id ? null : cur));
        },
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  }, []);
  return active;
}

function Links({ active, onPick, vertical = false }: { active: string | null; onPick?: () => void; vertical?: boolean }) {
  // onPick runs first: closing the menu restarts Lenis, which cancels any scroll already in flight.
  const go = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onPick?.();
    scrollToId(id);
  };
  return (
    <>
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          onClick={go(s.id)}
          className={`nav-link ${active === s.id ? 'is-here' : ''}`}
          style={vertical ? { fontSize: '1.7rem', alignSelf: 'flex-start' } : undefined}
        >
          {s.label}
        </a>
      ))}
    </>
  );
}

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <a
      href="#top"
      onClick={(e) => {
        e.preventDefault();
        scrollToTop();
      }}
      className={`hand relative inline-block ${small ? 'text-[1.5rem]' : 'text-[2rem]'}`}
      aria-label="Back to the top"
    >
      {identity.name}
      <ThinLine className="absolute left-0 right-0 -bottom-2 h-3 w-full" style={{ width: '100%' }} />
    </a>
  );
}

/** Header at the top of the sheet plus a slim fixed bar that shows once the hero has scrolled away. */
export function Nav() {
  const active = useActiveSection();
  const [open, setOpen] = useState(false);
  const [barShown, setBarShown] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  // The menu's scroll lock. A link lets go of it before it scrolls, see onPick below.
  const releaseLock = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    gsap.set(el, { yPercent: -110 });
    const st = ScrollTrigger.create({
      start: () => window.innerHeight * 0.85,
      onToggle: (self) => {
        setBarShown(self.isActive);
        gsap.to(el, { yPercent: self.isActive ? 0 : -110, duration: 0.5, ease: 'power3.out' });
      },
    });
    return () => st.kill();
  }, []);

  // The open menu holds the page still, keeps focus inside, closes on Escape and hands focus back.
  useEffect(() => {
    if (!open) return;
    releaseLock.current = lockScroll();
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (menu.current) trapTab(menu.current, e);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      releaseLock.current?.();
      releaseLock.current = null;
      opener.current?.focus();
    };
  }, [open]);

  const openMenu = (e: MouseEvent<HTMLButtonElement>) => {
    opener.current = e.currentTarget;
    setOpen(true);
  };

  const resume = (
    <a href={asset(resumePath)} target="_blank" rel="noreferrer" className="box is-small">
      {contact.resume}
    </a>
  );

  return (
    <>
      <header className="wrap flex items-center justify-between pt-6 md:pt-7 reveal" data-nav>
        <Logo />
        <nav className="hidden md:flex items-center gap-8 lg:gap-10" aria-label="Sections">
          <Links active={active} />
        </nav>
        <div className="hidden md:block">{resume}</div>
        <button type="button" className="box is-small md:hidden" onClick={openMenu} aria-expanded={open} aria-controls="menu">
          menu
        </button>
      </header>

      <div
        ref={bar}
        className="fixed left-0 right-0 top-0 z-30 border-b border-dashed border-ink/25 bg-paper/90 backdrop-blur-sm"
        inert={!barShown}
        aria-hidden={!barShown}
      >
        <div className="wrap flex items-center justify-between py-3">
          <Logo small />
          <nav className="hidden md:flex items-center gap-7" aria-label="Sections">
            <Links active={active} />
          </nav>
          <div className="hidden md:block">{resume}</div>
          <button type="button" className="box is-small md:hidden" onClick={openMenu} aria-expanded={open} aria-controls="menu">
            menu
          </button>
        </div>
      </div>

      {open && (
        <div ref={menu} id="menu" className="fixed inset-0 z-50 sheet flex flex-col" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="wrap flex items-center justify-between pt-6">
            <Logo />
            <button ref={closeButton} type="button" className="box is-small" onClick={() => setOpen(false)}>
              close
            </button>
          </div>
          <nav className="wrap mt-16 flex flex-col gap-6" aria-label="Sections">
            <Links
              active={active}
              vertical
              onPick={() => {
                // Letting go of the lock restarts Lenis, which cancels any scroll in flight. So the
                // lock goes first and the link scrolls after.
                releaseLock.current?.();
                setOpen(false);
              }}
            />
            <div className="pt-4">{resume}</div>
          </nav>
        </div>
      )}
    </>
  );
}
