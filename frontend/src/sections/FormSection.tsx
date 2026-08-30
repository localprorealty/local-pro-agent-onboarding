import { useState, useEffect, type FormEvent } from "react";
import { SectionShell } from "@/components/SectionShell";
import { EditorialHeader } from "@/components/EditorialHeader";
import { Reveal } from "@/components/Reveal";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import type { SectionData } from "@/data/content";

export function FormSection({ data, sharedByName = null }: { data: SectionData; sharedByName?: string | null }) {
  const { user } = useGoogleAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const webhookUrl = import.meta.env.VITE_SHEET_WEBHOOK_URL;
      const secret = import.meta.env.VITE_SHEET_SHARED_SECRET;
      
      if (!webhookUrl) {
        throw new Error("VITE_SHEET_WEBHOOK_URL is not configured.");
      }

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ name, email, phone, secret }),
      });
      if (!res.ok) throw new Error("Submit failed");
      
      const data = await res.json();
      if (data.status !== "ok") {
        throw new Error(data.message || "Submit failed");
      }
      setSubmitted(true);
    } catch {
      setError("Something didn't go through. Mind trying again?");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SectionShell id={data.id} className="min-h-[60vh] pt-4 pb-24">
      <EditorialHeader align="center" eyebrow={data.eyebrow} title={data.title} body={"body" in data ? data.body : undefined} />

      <Reveal delay={0.2}>
        {submitted ? (
          <p className="mt-10 text-center text-lp-gold text-lg">Thanks — we've got it. That's all.</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-3 max-w-sm mx-auto">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="bg-lp-card border border-lp-border rounded-lg px-4 py-2.5 text-sm text-lp-smoke focus:border-lp-gold outline-none"
            />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="bg-lp-card border border-lp-border rounded-lg px-4 py-2.5 text-sm text-lp-smoke focus:border-lp-gold outline-none"
            />
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              className="bg-lp-card border border-lp-border rounded-lg px-4 py-2.5 text-sm text-lp-smoke focus:border-lp-gold outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 bg-lp-gold text-lp-bg font-medium rounded-lg px-4 py-2.5 text-sm disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Submit"}
            </button>
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

            <p className="mt-4 text-[11px] text-lp-grey/80 text-center font-medium leading-relaxed font-body">
              {sharedByName
                ? `Prefer to talk to ${sharedByName} directly? Call anytime: (972) 400-0017`
                : "Prefer to just talk? Call Deana anytime: (972) 400-0017"
              }
            </p>
          </form>
        )}
      </Reveal>
    </SectionShell>
  );
}
