import { SectionShell } from "@/components/SectionShell";
import { EditorialHeader } from "@/components/EditorialHeader";
import { Reveal } from "@/components/Reveal";
import type { SectionData } from "@/data/content";

export function HiddenWeightSection({ data }: { data: SectionData }) {
  const items = "items" in data ? data.items : [];

  return (
    <SectionShell id={data.id}>
      <EditorialHeader eyebrow={data.eyebrow} title={data.title} body={"body" in data ? data.body : undefined} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
        {items.map((item, i) => (
          <Reveal key={item.label} delay={0.1 + i * 0.08}>
            <div className="p-4 rounded-xl bg-lp-card border border-lp-border h-full">
              <p className="text-lp-gold text-sm font-semibold tracking-wide mb-1">{item.label}</p>
              <p className="text-lp-grey text-sm leading-snug">{item.detail}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}
