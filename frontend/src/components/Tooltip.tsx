import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<"top" | "bottom">("top");
  const containerRef = useRef<HTMLSpanElement>(null);

  // Auto-dismiss tooltip on clicking/tapping outside (for mobile support)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  // Check available space when visible
  useEffect(() => {
    if (visible && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.top < 120) {
        setPosition("bottom");
      } else {
        setPosition("top");
      }
    }
  }, [visible]);

  return (
    <span
      ref={containerRef}
      className="relative inline-flex items-center gap-1 cursor-pointer select-none"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={() => setVisible((prev) => !prev)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.span
            initial={{ opacity: 0, scale: 0.95, y: position === "top" ? 5 : -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position === "top" ? 5 : -5 }}
            transition={{ duration: 0.15 }}
            className={`absolute left-1/2 -translate-x-1/2 w-64 p-3 rounded-lg bg-lp-card border border-lp-border shadow-2xl text-xs text-lp-smoke leading-normal z-50 text-center font-normal pointer-events-none ${
              position === "top" ? "bottom-full mb-2" : "top-full mt-2"
            }`}
          >
            {text}
            {/* Tooltip arrow */}
            {position === "top" ? (
              <>
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-lp-card" />
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-lp-border mt-[1px] -z-10" />
              </>
            ) : (
              <>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-lp-card" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-lp-border mb-[1px] -z-10" />
              </>
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
