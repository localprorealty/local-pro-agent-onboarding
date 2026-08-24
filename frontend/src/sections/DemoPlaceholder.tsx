import { SectionShell } from "@/components/SectionShell";
import { EditorialHeader } from "@/components/EditorialHeader";
import { Reveal } from "@/components/Reveal";
import type { SectionData } from "@/data/content";

const DEMO_LABELS: Record<string, string> = {
  "address-autofill": "Address → auto-filled listing fields",
  "ai-marketing": "Notes → AI-drafted listing copy",
  "extension-fill": "Matrix fields self-filling in sequence",
  "revenue-calculator": "Agents referred → live payout estimate",
};

export function DemoPlaceholder({ data }: { data: SectionData }) {
  const demoKey = "demo" in data ? data.demo : undefined;

  return (
    <SectionShell id={data.id}>
      <EditorialHeader eyebrow={data.eyebrow} title={data.title} body={"body" in data ? data.body : undefined} />
      <Reveal delay={0.2}>
        <div className="mt-10 rounded-2xl border border-dashed border-lp-border bg-lp-card/40 px-6 py-16 flex flex-col items-center justify-center text-center gap-2">
          <span className="text-[11px] uppercase tracking-widest text-lp-gold">
            Interactive demo — next build pass
          </span>
          <p className="text-lp-grey text-sm max-w-sm">
            {demoKey ? DEMO_LABELS[demoKey] : "Demo coming soon."}
          </p>
        </div>
      </Reveal>
    </SectionShell>
  );
}
