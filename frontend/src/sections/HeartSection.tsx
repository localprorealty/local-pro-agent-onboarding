import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { SectionShell } from "@/components/SectionShell";
import { EditorialHeader } from "@/components/EditorialHeader";
import type { SectionData } from "@/data/content";

export function HeartSection({ data }: { data: SectionData }) {
  const letters = "heart" in data ? data.heart : [];
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // Range mapping for 5 items:
    // 0.0 - 0.2 -> 0 (Honor)
    // 0.2 - 0.4 -> 1 (Excellence)
    // 0.4 - 0.6 -> 2 (Adaptability)
    // 0.6 - 0.8 -> 3 (Reliability)
    // 0.8 - 1.0 -> 4 (Transparency)
    const idx = Math.min(4, Math.floor(latest / 0.2));
    if (idx !== activeIndex) {
      setActiveIndex(idx);
    }
  });

  if (prefersReducedMotion) {
    return (
      <SectionShell id={data.id}>
        <EditorialHeader
          align="center"
          eyebrow={data.eyebrow}
          title={data.title}
          body={"body" in data ? data.body : undefined}
          videoNote={"videoNote" in data ? data.videoNote : undefined}
        />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-12">
          {letters.map((h) => (
            <div
              key={h.letter}
              className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-lp-card border border-lp-border h-full"
            >
              <span className="font-display font-extrabold text-3xl text-lp-gold">{h.letter}</span>
              <span className="text-lp-smoke text-sm font-medium">{h.word}</span>
              <span className="text-lp-grey text-xs">{h.detail}</span>
            </div>
          ))}
        </div>
      </SectionShell>
    );
  }

  return (
    <section id={data.id} ref={containerRef} className="relative h-[300vh] w-full">
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center items-center overflow-hidden px-6 md:px-16 py-8">
        
        {/* Editorial Header */}
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center text-center gap-4 select-none shrink-0 mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-lp-gold font-body">{data.eyebrow}</p>
          <h2 className="font-display font-bold text-3xl md:text-5xl leading-tight text-lp-smoke">
            {data.title}
          </h2>
          {"body" in data && (
            <p className="text-sm md:text-base text-lp-grey max-w-xl">{data.body}</p>
          )}
        </div>

        {/* Scroll Chapters layout */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full max-w-4xl mt-6">
          {letters.map((h, i) => {
            const isCollected = i < activeIndex;
            const isActive = i === activeIndex;

            return (
              <motion.div
                key={h.letter}
                layout
                className={`flex flex-col items-center text-center gap-2 p-6 rounded-xl border transition-all duration-500 h-full justify-center min-h-[160px] ${
                  isActive
                    ? "bg-lp-card border-lp-gold/60 scale-105 shadow-2xl shadow-lp-gold/5 z-10"
                    : isCollected
                    ? "bg-lp-bg-raised/40 border-lp-border/60 opacity-60 scale-95 z-0"
                    : "opacity-0 pointer-events-none scale-90 translate-y-4"
                }`}
              >
                <span className={`font-display font-extrabold transition-all duration-500 leading-none ${
                  isActive ? "text-5xl text-lp-gold" : "text-2xl text-lp-smoke"
                }`}>
                  {h.letter}
                </span>
                
                {(isActive || isCollected) && (
                  <span className={`text-lp-smoke font-semibold uppercase tracking-wider transition-all leading-none ${
                    isActive ? "text-xs mt-1" : "text-[10px]"
                  }`}>
                    {h.word}
                  </span>
                )}

                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-lp-grey text-[11px] mt-1 leading-normal max-w-[150px]"
                  >
                    {h.detail}
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
