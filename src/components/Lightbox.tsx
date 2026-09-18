import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { trapTab } from '@/lib/focus';
import { lockScroll } from '@/lib/scroll-store';
import { Img } from './Img';

type Props = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  caption: string;
  date: string;
  closeLabel: string;
  onClose: () => void;
};

/**
 * One screenshot at full size on a sheet of paper. Holds the page still, takes focus and closes
 * on Escape or a click outside the print. The opener puts focus back where it was.
 */
export function Lightbox({ src, alt, width, height, caption, date, closeLabel, onClose }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const release = lockScroll();
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (box.current) trapTab(box.current, e);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      release();
    };
  }, [onClose]);

  return createPortal(
    <div ref={box} className="lightbox" role="dialog" aria-modal="true" aria-label={caption} onClick={onClose}>
      <button ref={closeButton} type="button" className="box is-small lightbox-close" onClick={onClose}>
        {closeLabel}
      </button>
      <figure className="print lightbox-print m-0" onClick={(e) => e.stopPropagation()}>
        <span className="tape tc" />
        <Img src={src} alt={alt} width={width} height={height} />
        <figcaption className="cap">
          {caption} <span>{date}</span>
        </figcaption>
      </figure>
    </div>,
    document.body,
  );
}
