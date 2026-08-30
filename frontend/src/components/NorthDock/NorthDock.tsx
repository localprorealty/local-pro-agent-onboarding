import { useState } from "react";
import { motion } from "framer-motion";
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
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1c1a17] to-[#121214] border border-lp-border flex items-center justify-center text-lp-gold shadow-inner hover:border-lp-gold/60 transition-all duration-300">
                  <span className="font-display font-black text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-[#f3e7c4] to-[#cfb87c] drop-shadow-[0_0_8px_rgba(207,184,124,0.4)] select-none">
                    N
                  </span>
                </div>
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
