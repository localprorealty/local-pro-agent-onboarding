import { Reveal } from "./Reveal";
import { Tooltip } from "./Tooltip";

const GLOSSARY = {
  cap: "The annual split commission limit contributed to the brokerage ($16,000). Once reached, the agent keeps 100% of their commission for the remainder of their anniversary year.",
  tier: "The level in the rate matrix (1–5) determined by the number of active front-line referred agents, unlocking different payout rates."
};

function parseGlossaryTerms(text: string) {
  const regex = /\b(cap|tier|caps|tiers)\b/gi;
  const parts = text.split(regex);
  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    const lower = part.toLowerCase();
    if (lower === "cap" || lower === "caps") {
      return (
        <span key={index} className="inline-flex items-center">
          {part}
          <Tooltip text={GLOSSARY.cap}>
            <span className="text-lp-gold ml-0.5 select-none font-normal text-[11px] font-body bg-lp-gold/10 px-1 rounded hover:bg-lp-gold/20 transition-colors">ⓘ</span>
          </Tooltip>
        </span>
      );
    }
    if (lower === "tier" || lower === "tiers") {
      return (
        <span key={index} className="inline-flex items-center">
          {part}
          <Tooltip text={GLOSSARY.tier}>
            <span className="text-lp-gold ml-0.5 select-none font-normal text-[11px] font-body bg-lp-gold/10 px-1 rounded hover:bg-lp-gold/20 transition-colors">ⓘ</span>
          </Tooltip>
        </span>
      );
    }
    return part;
  });
}

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
          <p className="text-base md:text-lg text-lp-grey max-w-3xl">{parseGlossaryTerms(body)}</p>
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
