import { useCallback, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { asset } from '@/content/profile';
import { work } from '@/content/site';
import { Doodle } from './Doodle';
import { Img } from './Img';
import { Lightbox } from './Lightbox';
import { Section } from './Section';

const tilts = [-1.4, 1.2, -0.8, 0.9, -1.1];

type Item = (typeof work.board.items)[number];

export function Work() {
  const [openItem, setOpenItem] = useState<Item | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const open = (item: Item) => (e: MouseEvent<HTMLButtonElement>) => {
    opener.current = e.currentTarget;
    setOpenItem(item);
  };

  // Safari does not focus a clicked button, so the opener is remembered instead of read back.
  const close = useCallback(() => {
    setOpenItem(null);
    opener.current?.focus();
  }, []);

  return (
    <Section id="work" idx={work.idx} title={work.title} pen={work.pen} className="pt-20 md:pt-28">
      <div className="grid gap-6">
        {work.rows.map((row, i) => (
          <article key={row.role} className={`card reveal grid gap-5 px-6 py-6 md:grid-cols-[190px_1fr_250px] md:gap-8 md:px-8 md:py-7 ${i % 2 ? 'alt' : ''}`}>
            <div className="type text-ink-2">
              <b className="block font-normal text-red">{row.when}</b>
              {row.where}
            </div>
            <div>
              <h3 className="h3 text-[1.55rem] md:text-[1.7rem]">{row.role}</h3>
              <p className="type mb-3.5 mt-0.5 text-ink-2">{row.org}</p>
              <ul className="checks text-[1.02rem]">
                {row.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div className="relative hidden self-center md:block">
              <Doodle name={row.doodle} width={78} className="pop" />
              <span className="note absolute left-[96px] top-4 w-[130px] rotate-[-4deg] text-[1.3rem]">{row.tag}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="board mt-16 md:mt-24">
        <div className="board-head">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <h3 className="h3 reveal text-[1.55rem] md:text-[1.7rem]">{work.board.title}</h3>
            <span className="note reveal text-[1.35rem]">{work.board.pen}</span>
          </div>
          <p className="reveal max-w-[58ch] text-[1.02rem] leading-relaxed text-ink-2">{work.board.lede}</p>
        </div>
        {work.board.items.map((item, i) => (
          <div key={item.key} className="reveal" data-clip={item.key}>
            <button
              type="button"
              className="print tilt clip"
              style={{ '--tilt': `${tilts[i % tilts.length]}deg` } as CSSProperties}
              onClick={open(item)}
            >
              <span className="tape tl" />
              <span className="tape tr" />
              <Img src={asset(item.src)} alt={item.alt} width={item.w} height={item.h} loading="lazy" decoding="async" />
              <span className="cap">
                {item.cap} <span>{item.date}</span>
              </span>
              <span className="sr-only">, {work.board.open}</span>
            </button>
          </div>
        ))}
      </div>

      {openItem && (
        <Lightbox
          src={asset(openItem.src)}
          alt={openItem.alt}
          caption={openItem.cap}
          date={openItem.date}
          width={openItem.w}
          height={openItem.h}
          closeLabel={work.board.close}
          onClose={close}
        />
      )}
    </Section>
  );
}
