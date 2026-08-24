import { Reveal } from "./Reveal";

interface EditorialHeaderProps {
  eyebrow: string;
  title: string;
  body?: string;
  sub?: string;
  videoNote?: string;
  align?: "left" | "center";
}

export function EditorialHeader({
  eyebrow,
  title,
  body,
  sub,
  videoNote,
  align = "left",
}: EditorialHeaderProps) {
  const textAlign = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <div className={`flex flex-col ${textAlign} gap-4`}>
      <Reveal>
        <p className="text-xs uppercase tracking-[0.2em] text-lp-gold font-body">{eyebrow}</p>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 className="font-display font-bold text-3xl md:text-5xl leading-tight text-lp-smoke">
          {title}
        </h2>
      </Reveal>
      {body && (
        <Reveal delay={0.16}>
          <p className="text-base md:text-lg text-lp-grey max-w-xl">{body}</p>
        </Reveal>
      )}
      {sub && (
        <Reveal delay={0.22}>
          <p className="text-sm text-lp-grey/80 max-w-xl">{sub}</p>
        </Reveal>
      )}
      {videoNote && (
        <Reveal delay={0.28}>
          <div className="mt-2 px-3 py-1.5 rounded-md border border-dashed border-lp-border text-[11px] text-lp-grey font-body">
            {videoNote}
          </div>
        </Reveal>
      )}
    </div>
  );
}
