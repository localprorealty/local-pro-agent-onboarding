import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TreatButton } from "./TreatButton";
import { TraitCard } from "./TraitCard";
import { ChatPanel } from "./ChatPanel";
import { TRAITS } from "@/data/traits";

/**
 * Persistent corner widget, present across the whole scroll.
 * - Click North himself -> opens the GROQ-backed chat.
 * - Click the treat -> reaction animation + cycles through narrative cards.
 * These are two separate, independent interactions living in one widget.
 */
export function NorthDock() {
  const [chatOpen, setChatOpen] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [fedCount, setFedCount] = useState(0);
  const [traitIndex, setTraitIndex] = useState<number | null>(null);
  const [complete, setComplete] = useState(false);

  function handleFeed() {
    if (complete) return;

    setReacting(true);
    setTimeout(() => setReacting(false), 500);

    if (fedCount < TRAITS.length) {
      setTraitIndex(fedCount);
      setFedCount((c) => c + 1);
    } else {
      setFedCount((c) => c + 1);
      setTimeout(() => setComplete(true), 100);
    }
  }

  const getNorthImage = () => {
    if (traitIndex === null) return "/2.png";
    if (traitIndex >= 0 && traitIndex <= 2) return "/2.png"; // Chapter 1: beats 1-3
    if (traitIndex >= 3 && traitIndex <= 6) return "/2.png"; // Chapter 2: beats 4-7
    return "/2.png"; // Chapter 3: beats 8-10
  };

  const activeImage = getNorthImage();

  return (
    <>
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />

      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
        <div className="relative">
          <TraitCard
            trait={traitIndex !== null ? TRAITS[traitIndex] : null}
            complete={complete}
            fedCount={fedCount}
          />

          <div className="flex items-end gap-3">
            <motion.button
              onClick={() => setChatOpen((v) => !v)}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="cursor-pointer rounded-full relative overflow-hidden w-16 h-16 border border-lp-border bg-lp-card flex items-center justify-center shadow-lg"
              aria-label="Chat with North"
            >
              <div className="absolute inset-0 flex items-center justify-center p-0.5">
                <AnimatePresence mode="popLayout">
                  <motion.img
                    key={activeImage}
                    src={activeImage}
                    alt="North the guide"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full object-cover rounded-full"
                  />
                </AnimatePresence>
              </div>

              {reacting && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 1.2, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 bg-lp-gold/30 rounded-full pointer-events-none"
                />
              )}
            </motion.button>

            <TreatButton onFeed={handleFeed} />
          </div>
        </div>

        {fedCount > 0 && !complete && (
          <div className="flex gap-1 pr-1" aria-hidden="true">
            {TRAITS.map((_, i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-colors"
                style={{ background: i < fedCount ? "#cfb87c" : "#2a2a2a" }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
