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
            Give North a treat
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
        className="flex items-center justify-center w-11 h-11 rounded-full bg-lp-card border border-lp-border cursor-pointer"
        aria-label="Give North a treat"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 9a2 2 0 100 4 2 2 0 000-4zM4 9v4M20 9a2 2 0 110 4 2 2 0 010-4zM20 9v4M6 10.5h12v3H6z"
            stroke="#cfb87c"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </motion.button>
    </div>
  );
}
