import { motion, useTransform, MotionValue } from "framer-motion";
import { useEffect, useState } from "react";

interface BrandingBarProps {
  scrollYProgress: MotionValue<number>;
}

export function BrandingBar({ scrollYProgress }: BrandingBarProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Fade-in transition from 18% to 25% scroll progress
  const opacity = useTransform(scrollYProgress, [0.18, 0.25], [0, 1]);

  // Fallback direct toggle for users preferring reduced motion
  useEffect(() => {
    if (!prefersReducedMotion) return;
    return scrollYProgress.onChange((latest) => {
      setVisible(latest >= 0.20);
    });
  }, [scrollYProgress, prefersReducedMotion]);

  if (prefersReducedMotion) {
    if (!visible) return null;
    return (
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 bg-lp-bg/85 backdrop-blur-md border-b border-lp-border/50">
        <div className="flex items-center gap-1 font-display font-bold text-lg tracking-tight select-none">
          <span className="text-lp-smoke">Local</span>
          <span className="text-lp-gold">PRO</span>
          <span className="text-[10px] tracking-[0.2em] font-semibold text-lp-gold uppercase ml-1.5 self-center">
            REALTY
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      style={{ opacity }}
      className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 bg-lp-bg/85 backdrop-blur-md border-b border-lp-border/50 pointer-events-none select-none"
    >
      <div className="flex items-center gap-1 font-display font-bold text-lg tracking-tight">
        <span className="text-lp-smoke">Local</span>
        <span className="text-lp-gold">PRO</span>
        <span className="text-[10px] tracking-[0.2em] font-semibold text-lp-gold uppercase ml-1.5 self-center">
          REALTY
        </span>
      </div>
    </motion.div>
  );
}
