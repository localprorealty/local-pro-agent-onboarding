import { AnimatePresence, motion } from "framer-motion";
import type { Trait } from "@/data/traits";

interface TraitCardProps {
  trait: Trait | null;
  complete: boolean;
  fedCount: number;
}

export function TraitCard({ trait, complete, fedCount }: TraitCardProps) {
  return (
    <div className="absolute bottom-full right-0 mb-3 w-72" style={{ minHeight: 0 }}>
      <AnimatePresence mode="wait">
        {complete && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="p-4 rounded-xl bg-lp-card border border-lp-gold text-center font-north"
          >
            <p className="text-sm text-lp-smoke">
              You've fed North {fedCount} times. Welcome to the pack.
            </p>
          </motion.div>
        )}
        {!complete && trait && (
          <motion.div
            key={trait.text}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="p-4 rounded-xl bg-lp-card border border-lp-border font-north"
          >
            <p className="text-sm text-lp-smoke leading-relaxed">{trait.text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
