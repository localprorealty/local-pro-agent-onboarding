import { SectionShell } from "@/components/SectionShell";
import { EditorialHeader } from "@/components/EditorialHeader";

interface PersonalizedWelcomeProps {
  name: string | null;
  sharedByName: string | null;
}

export function PersonalizedWelcome({ name, sharedByName }: PersonalizedWelcomeProps) {
  if (!name) return null;

  const bodyCopy = sharedByName
    ? `${sharedByName} thought you'd be a great fit here — welcome to LocalPRO. If any of this feels right, the easiest next step is filling out the form below.`
    : "Deana wanted you to see this yourself — welcome to LocalPRO. If any of this feels like the right fit, the easiest next step is filling out the form below. We'll take it from there.";

  return (
    <SectionShell id="personalized-welcome" className="min-h-0 py-12">
      <EditorialHeader
        align="center"
        eyebrow="A personal note"
        title={`Hey ${name}, glad you're here.`}
        body={bodyCopy}
      />
    </SectionShell>
  );
}
