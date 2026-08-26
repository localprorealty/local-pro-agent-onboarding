import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { SectionShell } from "@/components/SectionShell";
import { EditorialHeader } from "@/components/EditorialHeader";
import type { SectionData } from "@/data/content";
import { VideoBlock } from "@/components/VideoBlock";

export function HeroSection({ data }: { data: SectionData }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // 1. Logo Reveal (0 - 18%)
  const logoOpacity = useTransform(scrollYProgress, [0, 0.05, 0.12, 0.2], [0, 1, 1, 0]);
  const logoScale = useTransform(scrollYProgress, [0.12, 0.2], [1, 0.85]);
  const logoY = useTransform(scrollYProgress, [0.12, 0.2], [0, -30]);

  // 3. Eyebrow + Title + Copy (Strictly sequential: 22% - 55%)
  // Title: Settling in focus and scaling down slightly
  const titleScale = useTransform(scrollYProgress, [0.22, 0.45], [1.08, 1]);
  const titleBlur = useTransform(scrollYProgress, [0.22, 0.38], [8, 0]);
  const titleOpacity = useTransform(scrollYProgress, [0.22, 0.32, 0.48, 0.55], [0, 1, 1, 0]);

  // Eyebrow
  const eyebrowOpacity = useTransform(scrollYProgress, [0.22, 0.3, 0.48, 0.55], [0, 1, 1, 0]);

  // Body
  const bodyOpacity = useTransform(scrollYProgress, [0.3, 0.4, 0.48, 0.55], [0, 1, 1, 0]);
  const bodyY = useTransform(scrollYProgress, [0.3, 0.4], [20, 0]);

  // Sub Copy
  const subOpacity = useTransform(scrollYProgress, [0.38, 0.46, 0.48, 0.55], [0, 1, 1, 0]);
  const subY = useTransform(scrollYProgress, [0.38, 0.46], [20, 0]);

  // VideoNote (crosses 70% - 90%)
  const videoNoteOpacity = useTransform(scrollYProgress, [0.7, 0.9], [0, 1]);
  const videoNoteY = useTransform(scrollYProgress, [0.7, 0.9], [20, 0]);

  // Text container translates up cleanly before video enters
  const textY = useTransform(scrollYProgress, [0.35, 0.55], [0, -240]);

  // Video transitions: starts invisible and translated down, then fades in and centers
  const videoOpacity = useTransform(scrollYProgress, [0.55, 0.7, 0.85, 0.95], [0, 1, 1, 0]);
  const videoY = useTransform(scrollYProgress, [0.55, 0.7], [180, 0]);
  const videoScale = useTransform(scrollYProgress, [0.55, 0.7], [0.92, 1]);

  if (prefersReducedMotion) {
    return (
      <SectionShell id={data.id}>
        <EditorialHeader
          align="center"
          eyebrow={data.eyebrow}
          title={data.title}
          body={"body" in data ? data.body : undefined}
          sub={"sub" in data ? data.sub : undefined}
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

  return (
    <section id={data.id} ref={containerRef} className="relative h-[400vh] w-full">
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center items-center overflow-hidden px-6 md:px-16 py-8">

        {/* Brand-Reveal Opening Beat */}
        <motion.div
          style={{ opacity: logoOpacity, scale: logoScale, y: logoY }}
          className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none select-none z-20"
        >
          <h1 className="font-display font-extrabold text-6xl md:text-8xl tracking-tighter leading-none select-none">
            <span className="text-lp-smoke">Local</span>
            <span className="text-lp-gold">PRO</span>
          </h1>
          <p className="text-[11px] md:text-xs tracking-[0.4em] font-semibold text-lp-gold uppercase mt-3">
            REALTY
          </p>
        </motion.div>



        {/* Content Container */}
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center text-center gap-6 relative z-10">
          <motion.div
            style={{ y: textY }}
            className="flex flex-col items-center text-center gap-6 w-full"
          >
            {/* Eyebrow */}
            <motion.p
              style={{ opacity: eyebrowOpacity }}
              className="text-xs uppercase tracking-[0.2em] text-lp-gold font-body"
            >
              {data.eyebrow}
            </motion.p>

            {/* Title (Headline) */}
            <motion.h2
              style={{
                scale: titleScale,
                opacity: titleOpacity,
                filter: useTransform(titleBlur, (b) => `blur(${b}px)`),
              }}
              className="font-display font-bold text-3xl md:text-5xl leading-tight text-lp-smoke max-w-2xl"
            >
              {data.title}
            </motion.h2>

            {/* Body */}
            {"body" in data && (
              <motion.p
                style={{ opacity: bodyOpacity, y: bodyY }}
                className="text-base md:text-lg text-lp-grey max-w-xl"
              >
                {data.body}
              </motion.p>
            )}

            {/* Sub Copy */}
            {"sub" in data && (
              <motion.p
                style={{ opacity: subOpacity, y: subY }}
                className="text-sm text-lp-grey/80 max-w-xl"
              >
                {data.sub}
              </motion.p>
            )}
          </motion.div>

          {/* VideoNote */}
          {"videoNote" in data && (
            <motion.div
              style={{ opacity: videoNoteOpacity, y: videoNoteY }}
              className="mt-2 px-3 py-1.5 rounded-md border border-dashed border-lp-border text-[11px] text-lp-grey font-body"
            >
              {data.videoNote}
            </motion.div>
          )}
        </div>

        {/* Video */}
        {"video" in data && data.video && (
          <motion.div
            style={{
              opacity: videoOpacity,
              y: videoY,
              scale: videoScale,
            }}
            className="absolute max-w-4xl w-full px-6 z-20 hero-video-wrapper"
          >
            <VideoBlock src={data.video.src} gatesScroll={data.video.gatesScroll} />
          </motion.div>
        )}
      </div>
    </section>
  );
}
