import { motion, useScroll, useSpring, useTransform } from "framer-motion";

interface ScrollProgressProps {
  sectionCount: number;
}

/**
 * A vertical progress rail down the right edge of the screen.
 * Fills with gold as you scroll — a quiet, on-brand stand-in for a
 * generic scrollbar, echoing North's "trail" without literal paw icons
 * (keeps this decorative element quiet per the design skill's restraint note).
 */
export function ScrollProgress({ sectionCount }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const smoothed = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });
  const height = useTransform(smoothed, (v) => `${v * 100}%`);

  return (
    <div
      className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-3"
      aria-hidden="true"
    >
      <div className="relative w-px h-64 bg-lp-border overflow-hidden rounded-full">
        <motion.div
          className="absolute top-0 left-0 w-full bg-lp-gold rounded-full"
          style={{ height }}
        />
      </div>
      <span className="text-[10px] tracking-widest text-lp-grey font-body [writing-mode:vertical-rl] whitespace-nowrap">
        {sectionCount} STEPS
      </span>
    </div>
  );
}
