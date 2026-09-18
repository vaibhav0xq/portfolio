import { useEffect, useRef, type ReactNode } from 'react';
import { animateOnScroll } from '@/lib/motion';

type Props = {
  id: string;
  idx: string;
  title: string;
  pen?: string;
  children: ReactNode;
  className?: string;
  label?: string;
};

/**
 * A titled block of the sheet. Anything inside marked .reveal, .draw or .pop animates in when the
 * section reaches the viewport, so each section only has to place its content.
 */
export function Section({ id, idx, title, pen, children, className = '', label }: Props) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    return animateOnScroll(el);
  }, []);

  return (
    <section ref={root} id={id} className={`wrap ${className}`} aria-label={label ?? title}>
      <div className="sec-head">
        <span className="idx reveal">{idx}</span>
        <h2 className="h2 reveal">{title}</h2>
        {pen && <span className="pen reveal">{pen}</span>}
      </div>
      {children}
    </section>
  );
}
