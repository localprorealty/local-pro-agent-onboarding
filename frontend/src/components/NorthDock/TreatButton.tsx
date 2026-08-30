import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TreatButtonProps {
  onFeed: () => void;
}

export function TreatButton({ onFeed }: TreatButtonProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative">
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-lp-bg-raised border border-lp-border text-[10px] text-lp-smoke font-medium whitespace-nowrap shadow-lg pointer-events-none z-50"
          >
            North's Insights
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={onFeed}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileTap={{ scale: 0.85 }}
        animate={{ y: [0, -6, 0], rotate: [0, 6, -6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="flex items-center justify-center w-11 h-11 rounded-full bg-lp-card border border-lp-border cursor-pointer hover:border-lp-gold/55 transition-colors"
        aria-label="North's Insights"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cfb87c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 006 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
          <path d="M9 18h6M10 22h4" />
        </svg>
      </motion.button>
    </div>
  );
}
