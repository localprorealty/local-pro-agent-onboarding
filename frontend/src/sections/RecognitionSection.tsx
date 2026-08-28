import { useEffect, useRef, useState } from "react";
import { SectionShell } from "@/components/SectionShell";
import { EditorialHeader } from "@/components/EditorialHeader";
import { Reveal } from "@/components/Reveal";
import type { SectionData } from "@/data/content";
import confetti from "canvas-confetti";

export function RecognitionSection({ data }: { data: SectionData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const handleBadgeHover = (e: React.MouseEvent<HTMLImageElement>) => {
    if (prefersReducedMotion) return;

    const rect = e.currentTarget.getBoundingClientRect();
    // Normalize coordinates relative to viewport size to pop confetti directly from the hovered element
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 70,
      angle: 90,
      spread: 75,
      origin: { x, y },
      colors: ["#cfb87c", "#ffffff", "#1a1a1a"],
    });
  };

  const badges = "badges" in data ? data.badges : [];

  return (
    <SectionShell id={data.id}>
      <div ref={containerRef} className="w-full flex flex-col items-center text-center gap-8">
        <EditorialHeader
          align="center"
          eyebrow={data.eyebrow}
          title={data.title}
          body={"body" in data ? data.body : undefined}
        />
        {badges && badges.length > 0 && (
          <div className="w-full flex flex-col md:flex-row justify-center items-center gap-12 mt-8">
            {badges.map((src, i) => {
              const isLeftCard = i === 0;
              const cardClass = isLeftCard
                ? "relative group p-8 bg-lp-card/15 hover:bg-lp-card/30 border-l-[3px] border-t-[3px] border-r-0 border-b-0 border-lp-gold/45 hover:border-lp-gold transition-all duration-500 select-none cursor-pointer"
                : "relative group p-8 bg-lp-card/15 hover:bg-lp-card/30 border-r-[3px] border-b-[3px] border-l-0 border-t-0 border-lp-gold/45 hover:border-lp-gold transition-all duration-500 select-none cursor-pointer";

              return (
                <Reveal key={i} delay={0.15 + i * 0.12}>
                  <div className={cardClass}>
                    {/* Subtle golden backing glow */}
                    <div className="absolute inset-0 bg-lp-gold/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <img
                      src={src}
                      alt="DFW Top Workplace Award Logo"
                      onMouseEnter={handleBadgeHover}
                      className="h-56 md:h-68 w-auto object-contain relative z-10 transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </SectionShell>
  );
}
