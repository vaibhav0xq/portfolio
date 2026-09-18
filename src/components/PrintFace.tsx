import { useEffect, useRef } from 'react';
import type { HeroPrint } from '@/content/site';
import { FACE_RATIO, loadPrintFonts, paintFace } from '@/scene/faces';

/** The page of one hero print, drawn on a canvas at whatever width the print gets. */
export function PrintFace({ item }: { item: HeroPrint }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let alive = true;
    let frame = 0;
    const paint = () => {
      const w = canvas.clientWidth;
      if (!w) return;
      const h = Math.round(w * FACE_RATIO[item.kind]);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintFace(ctx, item, w, h);
    };
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    });
    loadPrintFonts().then(() => {
      if (!alive) return;
      paint();
      ro.observe(canvas);
    });
    return () => {
      alive = false;
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [item]);

  return <canvas ref={ref} style={{ aspectRatio: `1 / ${FACE_RATIO[item.kind]}` }} />;
}
