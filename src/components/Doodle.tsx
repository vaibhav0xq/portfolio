import type { CSSProperties } from 'react';
import { asset } from '@/content/profile';
import { Img } from './Img';

export type DoodleName =
  | 'coffee'
  | 'bubble'
  | 'shield'
  | 'chain'
  | 'plant'
  | 'plane'
  | 'megaphone'
  | 'sparkle'
  | 'cursor'
  | 'arrow'
  | 'tools';

type Props = {
  name: DoodleName;
  width: number;
  className?: string;
  style?: CSSProperties;
};

// Red felt tip drawings. They are raster files, so they multiply onto the paper instead of sitting on white.
// They are decoration, so one that will not load is dropped rather than replaced.
export function Doodle({ name, width, className = '', style }: Props) {
  return (
    <Img
      fallback={null}
      className={`doodle ${className}`}
      src={asset(`doodles/${name}.webp`)}
      alt=""
      aria-hidden
      draggable={false}
      style={{ width, ...style }}
    />
  );
}
