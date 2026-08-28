import { useEffect, useRef, useState } from "react";
import { SectionShell } from "@/components/SectionShell";
import { EditorialHeader } from "@/components/EditorialHeader";
import { Reveal } from "@/components/Reveal";
import type { SectionData } from "@/data/content";
import confetti from "canvas-confetti";

export function RecognitionSection({ data }: { data: SectionData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !firedRef.current) {
          firedRef.current = true;
          // Trigger a celebratory confetti burst with LocalPRO color accents (gold, white, dark)
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#cfb87c", "#ffffff", "#1a1a1a"],
          });
        }
      },
      { threshold: 0.4 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [prefersReducedMotion]);

  const handleBadgeHover = (e: React.MouseEvent<HTMLImageElement>) => {
    if (prefersReducedMotion) return;

    const rect = e.currentTarget.getBoundingClientRect();
    // Normalize coordinates relative to viewport size to pop confetti directly from the hovered element
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 60,
      angle: 90,
      spread: 70,
      origin: { x, y },
      colors: ["#cfb87c", "#ffffff", "#1a1a1a"],
    });
  };

  const badges = "badges" in data ? data.badges : [];

  return (
    <SectionShell id={data.id}>
      <div ref={containerRef} className="w-full flex flex-col items-start gap-8">
        <EditorialHeader
          align="left"
          eyebrow={data.eyebrow}
          title={data.title}
          body={"body" in data ? data.body : undefined}
        />
        {badges && badges.length > 0 && (
          <div className="w-full flex flex-col sm:flex-row justify-start items-start sm:items-center gap-8 mt-6">
            {badges.map((src, i) => (
              <Reveal key={i} delay={0.15 + i * 0.12}>
                <div className="relative group p-6 rounded-2xl border border-lp-border bg-lp-card/35 transition-all duration-500 hover:border-lp-gold/30 hover:bg-lp-card/65 select-none">
                  {/* Soft golden backing glow */}
                  <div className="absolute inset-0 bg-lp-gold/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <img
                    src={src}
                    alt="DFW Top Workplace Award Logo"
                    onMouseEnter={handleBadgeHover}
                    className="h-44 md:h-52 w-auto object-contain relative z-10 transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </SectionShell>
  );
}
