import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hey, I'm North. Ask me anything about LocalPRO — culture, revenue share, the platform, whatever.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError("North's having trouble connecting right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-24 right-5 z-50 w-[340px] max-h-[480px] flex flex-col rounded-2xl bg-lp-card border border-lp-border shadow-2xl overflow-hidden font-north"
          role="dialog"
          aria-label="Chat with North"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-lp-border">
            <span className="text-sm font-medium text-lp-smoke">Ask North</span>
            <button
              onClick={onClose}
              aria-label="Close chat"
              className="text-lp-grey hover:text-lp-smoke transition-colors"
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <img
                    src="/2.png"
                    alt="North Avatar"
                    className="w-6 h-6 rounded-full object-cover border border-lp-border shrink-0 mt-0.5"
                  />
                )}
                <div
                  className={`text-sm leading-snug max-w-[80%] px-3 py-2 rounded-lg ${
                    m.role === "user"
                      ? "bg-lp-gold text-lp-bg"
                      : "bg-lp-bg-raised text-lp-smoke border border-lp-border"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-2 justify-start">
                <img
                  src="/2.png"
                  alt="North Avatar"
                  className="w-6 h-6 rounded-full object-cover border border-lp-border shrink-0 mt-0.5"
                />
                <div className="text-sm text-lp-grey px-3 py-2 bg-lp-bg-raised/40 rounded-lg border border-lp-border/40">
                  North is thinking…
                </div>
              </div>
            )}
            {error && <div className="text-sm text-red-400 px-3 py-2">{error}</div>}
          </div>

          <div className="flex items-center gap-2 p-3 border-t border-lp-border">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about revenue share, culture…"
              className="flex-1 bg-lp-bg-raised text-sm text-lp-smoke rounded-lg px-3 py-2 border border-lp-border focus:border-lp-gold outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="text-sm font-medium text-lp-bg bg-lp-gold rounded-lg px-3 py-2 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
