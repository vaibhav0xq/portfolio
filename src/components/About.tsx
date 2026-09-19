import { about } from '@/content/site';
import { Doodle } from './Doodle';
import { Section } from './Section';

/** Splits a line on backticks so tool names can be set in the typewriter face. */
function Line({ text }: { text: string }) {
  const parts = text.split('`');
  // An unpaired backtick means a typo in the content; show the line as written rather than restyle half of it.
  if (parts.length % 2 === 0) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? (
          <span key={i} className="type whitespace-nowrap text-[0.9em] text-ink">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function About() {
  return (
    <Section id="about" idx={about.idx} title={about.title} pen={about.pen} className="pt-20 md:pt-28">
      <div className="grid gap-10 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-16">
        <div>
          {about.text.map((t, i) => (
            <p key={i} className={`prose reveal max-w-[38rem] text-[1.15rem] md:text-[1.25rem] ${i ? 'mt-5' : ''}`}>
              {t}
            </p>
          ))}
          <div className="relative mt-10 md:mt-12">
            <p className="type reveal mb-4 text-pencil">{about.useTitle}</p>
            <div className="grid gap-5">
              {about.use.map((row) => (
                <div key={row.label} className="reveal grid gap-1.5 md:grid-cols-[150px_1fr] md:gap-6">
                  <span className="hand text-[1.35rem] text-red">{row.label}</span>
                  <p className="m-0 max-w-[36rem] text-[1.02rem] leading-relaxed text-ink-2">
                    <Line text={row.text} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative md:pt-4">
          <dl className="card alt reveal m-0 grid gap-4 px-6 py-6 md:px-7 md:py-7">
            {about.facts.map((f) => (
              <div key={f.k} className="grid grid-cols-[120px_1fr] gap-4 border-b border-dashed border-ink/20 pb-3.5 last:border-0 last:pb-0">
                <dt className="type text-pencil">{f.k}</dt>
                <dd className="m-0 text-[1.02rem] leading-snug text-ink">{f.v}</dd>
              </div>
            ))}
          </dl>
          {/* The doodles sit under the facts card, inside this column, so they cannot run into the next section. */}
          <div className="relative mt-10 hidden h-[190px] md:block">
            <Doodle name="plant" width={80} className="pop absolute right-4 top-0 hidden lg:block" />
            <Doodle name="coffee" width={60} className="pop absolute left-[20%] top-12" />
          </div>
          <Doodle name="cursor" width={46} className="pop absolute -left-8 top-[55%] hidden lg:block" />
        </div>
      </div>
    </Section>
  );
}
