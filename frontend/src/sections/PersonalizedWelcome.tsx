import { Reveal } from "@/components/Reveal";

interface PersonalizedWelcomeProps {
  name: string | null;
  sharedByName: string | null;
}

export function PersonalizedWelcome({ name, sharedByName }: PersonalizedWelcomeProps) {
  if (!name) return null;

  const isDeana = !sharedByName || sharedByName.toLowerCase() === "deana";
  const senderName = isDeana ? "Deana" : sharedByName;

  const bodyCopy = isDeana
    ? "I wanted you to see this yourself, not just get another cold recruiting message. Take your time looking through this. There's no pressure and no obligation. If something here resonates, the form near the bottom is the easiest way to reach me."
    : `I thought you might be a good fit for LocalPRO, and wanted to send this along directly instead of through a generic recruiting message. Take your time looking through this. There's no pressure and no obligation. If something here resonates, the form near the bottom is the easiest way to reach me.`;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 w-full select-none" id="personalized-welcome">
      <Reveal>
        <div className="p-6 md:p-8 rounded-2xl bg-lp-card border border-lp-border shadow-xl flex flex-col items-center text-center gap-4">
          <p className="text-xs uppercase tracking-[0.2em] text-lp-gold font-body font-semibold">
            A note from {senderName}
          </p>
          <h2 className="font-display font-bold text-2xl md:text-3xl leading-tight text-lp-smoke">
            {name} & team, <br /> glad you found your way here.
          </h2>
          <p className="text-sm md:text-base text-lp-grey leading-relaxed max-w-2xl font-body">
            {bodyCopy}
          </p>
          <p className="text-xs italic text-lp-grey/70 mt-2 font-body font-medium">
            {senderName}
          </p>
        </div>
      </Reveal>
    </div>
  );
}
