import type { CSSProperties } from 'react';

// Pen marks drawn as SVG strokes. Every path has pathLength=1 so a dash offset from 1 to 0 draws it.

const stroke = { fill: 'none', stroke: 'var(--color-red)', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

type MarkProps = { className?: string; style?: CSSProperties; width?: number | string };

/** A single underline stroke that sits under a word. */
export function Underline({ className = '', style }: MarkProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden>
      <path className="draw" pathLength={1} d="M3 12 C 60 4, 120 16, 180 9 S 260 6, 297 11" {...stroke} strokeWidth={5} opacity={0.85} />
    </svg>
  );
}

/** Thin underline for the logotype and small notes. */
export function ThinLine({ className = '', style }: MarkProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden>
      <path className="draw" pathLength={1} d="M2 8 C 40 2, 80 11, 120 6 S 190 4, 198 7" {...stroke} strokeWidth={2.2} />
    </svg>
  );
}

/** A loose loop around a phrase. */
export function Loop({ className = '', style }: MarkProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 220 80" preserveAspectRatio="none" aria-hidden>
      <path
        className="draw"
        pathLength={1}
        d="M28 42 C 18 14, 110 4, 172 16 C 226 27, 196 70, 108 72 C 48 73, 6 60, 24 36 C 34 24, 60 20, 84 20"
        {...stroke}
        strokeWidth={2.4}
      />
    </svg>
  );
}

/** A curved arrow. Point it with a rotate in style. */
export function Arrow({ className = '', style, width = 120 }: MarkProps) {
  return (
    <svg className={className} style={{ width, ...style }} viewBox="0 0 190 70" aria-hidden>
      <path className="draw" pathLength={1} d="M6 52 C 50 8, 110 66, 172 22" {...stroke} strokeWidth={2.6} />
      <path className="draw" pathLength={1} d="M150 14 L 174 21 L 165 44" {...stroke} strokeWidth={2.6} />
    </svg>
  );
}

/** A short wavy divider. */
export function Squiggle({ className = '', style, width = 90 }: MarkProps) {
  return (
    <svg className={className} style={{ width, ...style }} viewBox="0 0 120 20" aria-hidden>
      <path className="draw" pathLength={1} d="M3 10 C 12 0, 22 20, 32 10 S 52 0, 62 10 S 82 20, 92 10 S 112 0, 117 10" {...stroke} strokeWidth={2.2} />
    </svg>
  );
}

/** A hand drawn check mark. */
export function Check({ className = '', style, width = 26 }: MarkProps) {
  return (
    <svg className={className} style={{ width, ...style }} viewBox="0 0 40 34" aria-hidden>
      <path className="draw" pathLength={1} d="M4 20 C 10 24, 14 28, 17 31 C 22 20, 29 10, 37 3" {...stroke} strokeWidth={3.4} />
    </svg>
  );
}
