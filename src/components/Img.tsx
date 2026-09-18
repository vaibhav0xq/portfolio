import { useEffect, useRef, useState, type ImgHTMLAttributes, type ReactNode } from 'react';
import { missing } from '@/content/site';

const RETRIES = 2;

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'onError' | 'src'> & {
  src: string;
  /** Rendered once the retries are spent. Defaults to the paper placeholder; pass null to drop the image. */
  fallback?: ReactNode;
};

/**
 * An <img> that never leaves a broken icon behind. A failed load is tried twice more after a short
 * pause and once again when the browser reports it is back online. After that the placeholder
 * takes the image's place at the same aspect ratio. The placeholder is inline SVG and text, so it
 * works with no network at all.
 */
export function Img({ src, fallback, width, height, alt, ...rest }: Props) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [seen, setSeen] = useState(src);
  const timer = useRef<number | undefined>(undefined);

  // A new source starts over.
  if (seen !== src) {
    setSeen(src);
    setAttempt(0);
    setFailed(false);
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!failed) return;
    const again = () => {
      setFailed(false);
      setAttempt((a) => a + 1);
    };
    window.addEventListener('online', again);
    return () => window.removeEventListener('online', again);
  }, [failed]);

  const onError = () => {
    if (attempt < RETRIES && navigator.onLine !== false) {
      timer.current = window.setTimeout(() => setAttempt(attempt + 1), 600 * (attempt + 1));
    } else {
      setFailed(true);
    }
  };

  if (failed) {
    if (fallback !== undefined) return <>{fallback}</>;
    return <Missing width={width} height={height} alt={alt} />;
  }

  // The query string makes the retry a fresh request instead of a replay of the failed one.
  const url = attempt === 0 ? src : `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}`;
  return <img src={url} alt={alt} width={width} height={height} onError={onError} {...rest} />;
}

type MissingProps = Pick<Props, 'width' | 'height' | 'alt'>;

/** The paper placeholder: a pen sketch of a picture and a note, sized like the image it stands in for. */
function Missing({ width, height, alt }: MissingProps) {
  const w = Number(width);
  const h = Number(height);
  const ratio = w > 0 && h > 0 ? `${w} / ${h}` : undefined;
  const label = alt ? `${missing.note}: ${alt}` : missing.note;
  return (
    <span className="missing" role="img" aria-label={label} style={ratio ? { aspectRatio: ratio } : undefined}>
      <svg viewBox="0 0 64 48" fill="none" stroke="var(--color-red)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 5 C 22 3, 44 4, 60 5 C 61 18, 60 32, 59 43 C 40 45, 20 44, 5 43 C 4 30, 3 17, 4 5 Z" />
        <path d="M8 40 C 14 32, 19 26, 24 20 C 27 24, 30 28, 33 31 C 35 29, 38 27, 40 25 C 45 30, 50 35, 56 40" />
        <path d="M46 9 C 50 9, 52 12, 51 15 C 50 19, 44 20, 42 16 C 40 12, 43 9, 46 9" />
      </svg>
      <span>
        <span className="note">{missing.note}</span>
        <small>{missing.hint}</small>
      </span>
    </span>
  );
}
