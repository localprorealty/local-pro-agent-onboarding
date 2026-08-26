import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionShell } from "@/components/SectionShell";
import { EditorialHeader } from "@/components/EditorialHeader";
import { Reveal } from "@/components/Reveal";
import type { SectionData } from "@/data/content";

interface PropertyData {
  "Property Type"?: string;
  Bedrooms?: string;
  Bathrooms?: string;
  "Square Footage"?: string;
  "Lot Size"?: string;
  "Year Built"?: string;
  "List Price"?: string;
}

const SAMPLE_LISTING: PropertyData = {
  "Property Type": "Single Family Home",
  Bedrooms: "4",
  Bathrooms: "3.5",
  "Square Footage": "3,250 sqft",
  "Lot Size": "0.34 acres",
  "Year Built": "2018",
  "List Price": "$675,000",
};

export function AIMarketingDemo({
  data,
  sharedMlsData,
}: {
  data: SectionData;
  sharedMlsData: any | null;
}) {
  const [activeProperty, setActiveProperty] = useState<PropertyData | null>(null);
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<string[]>([
    "/House-hero.jpg",
    "/House-kitchen.jpg",
    "/House-dining.jpg",
  ]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ description: string; socialCaption: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with shared MLS state if looked up
  useEffect(() => {
    if (sharedMlsData) {
      setActiveProperty(sharedMlsData);
    }
  }, [sharedMlsData]);

  const loadSample = () => {
    setActiveProperty(SAMPLE_LISTING);
    setErrorMsg(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 3);
    if (files.length === 0) return;

    const urls = files.map((file) => URL.createObjectURL(file));
    // Pad with defaults if less than 3 uploaded
    const filledUrls = [...urls];
    if (filledUrls.length < 3) {
      const fallbacks = ["/House-hero.jpg", "/House-kitchen.jpg", "/House-dining.jpg"];
      for (let i = filledUrls.length; i < 3; i++) {
        filledUrls.push(fallbacks[i]);
      }
    }
    setImages(filledUrls);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (!activeProperty) return;

    setGenerating(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
      const res = await fetch(`${apiBase}/generate-listing-copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyData: activeProperty,
          notes: notes,
        }),
      });

      if (res.status === 429) {
        setErrorMsg("Rate limit exceeded. Please wait a minute before generating again.");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to generate marketing copy");
      }

      const resData = await res.json();
      setResult(resData);
    } catch (err) {
      console.error(err);
      setErrorMsg("Marketing AI is temporarily offline. Please try again in a bit.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SectionShell id={data.id}>
      <EditorialHeader
        align="center"
        eyebrow={data.eyebrow}
        title={data.title}
        body={"body" in data ? data.body : undefined}
      />

      <Reveal delay={0.2}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-12 items-start max-w-4xl mx-auto text-lp-smoke">
          
          {/* Form Controls Column */}
          <div className="md:col-span-5 flex flex-col gap-5 p-6 rounded-2xl bg-lp-bg-raised border border-lp-border h-full relative">
            <h3 className="font-display font-semibold text-base text-lp-smoke">AI Copilot Parameters</h3>

            {!activeProperty ? (
              <div className="p-5 rounded-lg border border-dashed border-lp-border/60 bg-lp-card/30 text-center flex flex-col gap-3">
                <p className="text-xs text-lp-grey leading-relaxed">
                  No active MLS property detected. Look up an address in the demo section above, or load our sample listing to proceed.
                </p>
                <button
                  onClick={loadSample}
                  className="w-full bg-lp-gold/15 text-lp-gold hover:bg-lp-gold/20 border border-lp-gold/30 rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer"
                >
                  Load Sample Listing
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-lp-card/50 border border-lp-border/40 text-xs flex flex-col gap-2">
                <div className="flex justify-between items-center pb-2 border-b border-lp-border/30">
                  <span className="font-semibold text-lp-gold uppercase tracking-wider text-[10px]">
                    Property Details
                  </span>
                  <button
                    onClick={loadSample}
                    className="text-[10px] text-lp-grey underline hover:text-lp-smoke transition-colors border-0 bg-transparent cursor-pointer"
                  >
                    Reset to Sample
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-lp-grey">
                  <div>Type: <strong className="text-lp-smoke">{activeProperty["Property Type"]}</strong></div>
                  <div>Price: <strong className="text-lp-smoke">{activeProperty["List Price"]}</strong></div>
                  <div>Beds/Baths: <strong className="text-lp-smoke">{activeProperty.Bedrooms}/{activeProperty.Bathrooms}</strong></div>
                  <div>Sqft: <strong className="text-lp-smoke">{activeProperty["Square Footage"]}</strong></div>
                </div>
              </div>
            )}

            {/* Note field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="agent-notes" className="text-xs text-lp-grey font-medium uppercase tracking-wider">
                Special Selling Points (Optional)
              </label>
              <textarea
                id="agent-notes"
                rows={3}
                placeholder="E.g. newly renovated kitchen, custom walnut cabinets, oversized backyard oasis, quiet cul-de-sac..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={generating || !activeProperty}
                className="bg-lp-card border border-lp-border rounded-lg px-3 py-2 text-xs text-lp-smoke focus:border-lp-gold outline-none w-full resize-none transition-colors disabled:opacity-40"
              />
            </div>

            {/* Image upload */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-lp-grey font-medium uppercase tracking-wider">
                Listing Photos
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={generating || !activeProperty}
                className="hidden"
              />
              <button
                onClick={triggerUpload}
                disabled={generating || !activeProperty}
                className="w-full flex items-center justify-center gap-2 border border-lp-border hover:bg-lp-card/40 rounded-lg px-4 py-2.5 text-xs font-semibold text-lp-smoke transition-all cursor-pointer disabled:opacity-30"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
                Upload Custom Photos (Max 3)
              </button>
              <p className="text-[10px] text-lp-grey/75 text-center mt-1 italic">
                Using {images[0].startsWith("blob:") ? "custom uploaded images" : "default listing photos"}.
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !activeProperty}
              className="w-full bg-lp-gold text-lp-bg font-semibold rounded-lg px-4 py-3 text-sm disabled:opacity-30 hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {generating ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-lp-bg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Coordinating with North...
                </>
              ) : result ? (
                "Regenerate Copy"
              ) : (
                "Generate Marketing Package"
              )}
            </button>

            {errorMsg && <p className="text-red-400 text-xs text-center">{errorMsg}</p>}
          </div>

          {/* Marketing Output Display Column */}
          <div className="md:col-span-7 flex flex-col gap-6 p-6 rounded-2xl bg-lp-card border border-lp-border min-h-[420px] justify-between relative overflow-hidden">
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center justify-between pb-3 border-b border-lp-border/50">
                <span className="text-xs font-semibold uppercase tracking-widest text-lp-grey font-body">
                  Generated Assets
                </span>
                <span className="text-[10px] text-lp-grey/80 bg-lp-border/30 px-2 py-0.5 rounded font-medium">
                  GROQ / Llama-3.3
                </span>
              </div>

              <AnimatePresence mode="wait">
                {generating ? (
                  <motion.div
                    key="generating-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20 gap-3 text-center"
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-lp-border border-t-lp-gold animate-spin" />
                    <p className="text-sm text-lp-grey">North is drafting listing notes...</p>
                  </motion.div>
                ) : result ? (
                  <motion.div
                    key="results-state"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col gap-6"
                  >
                    {/* Listing Copy Card */}
                    <div className="rounded-xl overflow-hidden bg-lp-bg border border-lp-border/60 shadow-xl">
                      <div className="h-44 w-full overflow-hidden relative">
                        <img src={images[0]} alt="Listing Hero" className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-lp-bg/85 border border-lp-border text-[10px] text-lp-gold font-semibold uppercase tracking-wide">
                          MLS Main Photo
                        </div>
                      </div>
                      <div className="p-4 flex flex-col gap-2">
                        <h4 className="font-display font-semibold text-xs text-lp-gold uppercase tracking-wider">
                          Listing Description
                        </h4>
                        <p className="text-xs text-lp-grey leading-relaxed whitespace-pre-line">
                          {result.description}
                        </p>
                      </div>
                    </div>

                    {/* Social Post Instagram-style Card */}
                    <div className="rounded-xl bg-lp-bg border border-lp-border/60 shadow-xl max-w-md mx-auto w-full overflow-hidden">
                      {/* Insta Header */}
                      <div className="p-3 flex items-center gap-2.5 border-b border-lp-border/40">
                        <div className="w-7 h-7 rounded-full border border-lp-gold/50 overflow-hidden flex items-center justify-center">
                          <img src="/House-agent.jpg" alt="LocalPRO Agent" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-lp-smoke">localpro.realty</span>
                          <span className="text-[8px] text-lp-grey -mt-0.5">Sponsored • Dallas, TX</span>
                        </div>
                      </div>
                      {/* Insta Image */}
                      <div className="aspect-square w-full overflow-hidden">
                        <img src={images[1]} alt="Listing Social" className="w-full h-full object-cover" />
                      </div>
                      {/* Insta Caption */}
                      <div className="p-3 text-[11px] leading-relaxed text-lp-grey">
                        <span className="font-bold text-lp-smoke mr-1.5">localpro.realty</span>
                        {result.socialCaption}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center gap-2 text-lp-grey"
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                    </svg>
                    <p className="text-sm font-semibold text-lp-smoke mt-2">Marketing Draft Engine</p>
                    <p className="text-xs max-w-xs leading-relaxed">
                      Set up your property specifications and notes on the left, then click Generate to produce a full marketing package.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="text-[10px] text-lp-grey/60 border-t border-lp-border/30 pt-3 text-center w-full">
              ⚠️ AI-generated draft — always review before publishing.
            </div>
          </div>
        </div>
      </Reveal>
    </SectionShell>
  );
}
