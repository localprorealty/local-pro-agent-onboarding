import { SectionShell } from "@/components/SectionShell";
import { EditorialHeader } from "@/components/EditorialHeader";
import type { SectionData } from "@/data/content";
import { VideoBlock } from "@/components/VideoBlock";

export function NarrativeSection({ data, align = "left" }: { data: SectionData; align?: "left" | "center" }) {
  return (
    <SectionShell id={data.id}>
      <EditorialHeader
        align={align}
        eyebrow={data.eyebrow}
        title={data.title}
        body={"body" in data ? data.body : undefined}
        videoNote={"videoNote" in data ? data.videoNote : undefined}
      />
      {"video" in data && data.video && (
        <div className="w-full flex justify-center mt-8">
          <VideoBlock src={data.video.src} gatesScroll={data.video.gatesScroll} />
        </div>
      )}
    </SectionShell>
  );
}
