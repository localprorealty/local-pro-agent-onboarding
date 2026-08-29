import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionShell } from "@/components/SectionShell";
import { EditorialHeader } from "@/components/EditorialHeader";
import { Reveal } from "@/components/Reveal";
import type { SectionData } from "@/data/content";
import { VideoBlock } from "@/components/VideoBlock";

interface DiscoverCueProps {
  label?: string;
  prefersReducedMotion?: boolean;
}

export function DiscoverCue({ label = "Hands-on demo below", prefersReducedMotion = false }: DiscoverCueProps) {
  return (
    <div className="flex justify-center w-full mt-6 mb-2 select-none pointer-events-none">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lp-gold/5 border border-lp-gold/20 text-lp-gold text-[11px] font-bold uppercase tracking-wider shadow-sm">
        <span>{label}</span>
        <span className={prefersReducedMotion ? "" : "animate-bounce"}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </div>
    </div>
  );
}

interface ParsedAddress {
  line1: string;
  city: string;
  state: string;
  zip: string;
  fullAddress: string;
}

const SAMPLE_LISTING = {
  "Property Type": "Single Family Home",
  Bedrooms: "4",
  Bathrooms: "3.5",
  "Square Footage": "3,250 sqft",
  "Lot Size": "0.34 acres",
  "Year Built": "2018",
  "List Price": "$675,000",
};

export function AddressAutofillDemo({
  data,
  setSharedMlsData,
}: {
  data: SectionData;
  setSharedMlsData: (data: any | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [noSuggestionsFound, setNoSuggestionsFound] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<ParsedAddress | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadedData, setLoadedData] = useState<Array<{ label: string; value: string }> | null>(null);
  const [revealIndex, setRevealIndex] = useState(-1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const handleLoadDemoProperty = () => {
    setSelectedAddress({
      line1: "1229 Sam Dennis Dr",
      city: "Lewisville",
      state: "TX",
      zip: "75077",
      fullAddress: "1229 Sam Dennis Dr, Lewisville, TX 75077, USA",
    });
    setQuery("1229 Sam Dennis Dr, Lewisville, TX 75077, USA");
    setErrorMsg(null);
    setLoading(true);
    setLoadedData(null);
    setRevealIndex(-1);

    setTimeout(() => {
      setLoading(false);
      const mapped = Object.entries(SAMPLE_LISTING).map(([label, value]) => ({
        label,
        value: String(value),
      }));
      setLoadedData(mapped);
      setSharedMlsData(SAMPLE_LISTING);
      setRevealIndex(0);
    }, 1000);
  };
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Address search query debounced fetch with AbortController and 500ms delay / 4-character threshold
  useEffect(() => {
    if (query.trim().length < 4) {
      setSuggestions([]);
      setNoSuggestionsFound(false);
      setLoadingSuggestions(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      return;
    }

    if (selectedAddress && query === selectedAddress.fullAddress) {
      setLoadingSuggestions(false);
      return;
    }

    // Set loading indicator in flight
    setLoadingSuggestions(true);
    setNoSuggestionsFound(false);

    const timer = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
        const res = await fetch(`${apiBase}/address-suggest?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Autosuggest request failed");
        
        const resData = await res.json();
        const items = resData.items || [];
        setSuggestions(items);
        if (items.length === 0) {
          setNoSuggestionsFound(true);
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          return;
        }
        console.error("Autosuggest fetch error:", err);
        setSuggestions([]);
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
          setLoadingSuggestions(false);
        }
      }
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [query, selectedAddress]);

  // Click outside suggestion dropdown logic
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (match: any) => {
    const parsed: ParsedAddress = {
      line1: match.addressLine1 || "Unknown",
      city: match.city || "Unknown",
      state: match.state || "Unknown",
      zip: match.zip || "00000",
      fullAddress: match.label,
    };

    setSelectedAddress(parsed);
    setQuery(match.label);
    setSuggestions([]);
    setNoSuggestionsFound(false);

    setLoadedData(null);
    setSharedMlsData(null);
    setRevealIndex(-1);
    setErrorMsg(null);
    setShowCelebration(false);
  };

  const handlePullListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddress) return;

    setLoading(true);
    setLoadedData(null);
    setSharedMlsData(null);
    setRevealIndex(-1);
    setErrorMsg(null);
    setShowCelebration(false);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
      const res = await fetch(`${apiBase}/mls-lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressLine1: selectedAddress.line1,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zip: selectedAddress.zip,
        }),
      });

      if (res.status === 429) {
        setErrorMsg("Too many lookup requests. Please wait a minute and try again.");
        setLoadedData([]);
        return;
      }

      if (!res.ok) {
        throw new Error("Lookup temporarily unavailable");
      }

      const resData = await res.json();
      if (resData.found && resData.data) {
        const mapped = Object.entries(resData.data).map(([label, value]) => ({
          label,
          value: String(value),
        }));
        setLoadedData(mapped);
        setSharedMlsData(resData.data);
        setRevealIndex(0);
      } else {
        setLoadedData([]);
        setSharedMlsData(null);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Lookup temporarily unavailable. Please try again later.");
      setLoadedData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle staggered reveal index increment
  useEffect(() => {
    if (loadedData && revealIndex >= 0 && revealIndex < loadedData.length) {
      const timer = setTimeout(() => {
        setRevealIndex((prev) => prev + 1);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [revealIndex, loadedData]);

  return (
    <SectionShell id={data.id}>
      <EditorialHeader
        align="center"
        eyebrow={data.eyebrow}
        title={data.title}
        body={"body" in data ? data.body : undefined}
      />

      {"video" in data && data.video && (
        <div className="w-full flex flex-col items-center gap-6 mt-8">
          {Array.isArray(data.video) ? (
            data.video.map((v, i) => (
              <VideoBlock key={i} src={v.src} gatesScroll={v.gatesScroll} />
            ))
          ) : (
            <VideoBlock src={(data.video as any).src} gatesScroll={(data.video as any).gatesScroll} />
          )}
        </div>
      )}

      <DiscoverCue label="Hands-on demo below" prefersReducedMotion={prefersReducedMotion} />

      <Reveal delay={0.2}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-12 items-start max-w-4xl mx-auto">
          
          {/* Autocomplete Input Form Column */}
          <div className="md:col-span-5 flex flex-col gap-4 p-6 rounded-2xl bg-lp-bg-raised border border-lp-border h-full relative">
            <h3 className="font-display font-semibold text-base text-lp-smoke">MLS Lookup Engine</h3>
            
            <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
              <label htmlFor="address-autocomplete" className="text-xs text-lp-grey font-medium uppercase tracking-wider">
                Search US Address
              </label>
              
              <div className="relative w-full">
                <input
                  id="address-autocomplete"
                  type="text"
                  autoComplete="off"
                  placeholder="Start typing a US address..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (selectedAddress && e.target.value !== selectedAddress.fullAddress) {
                      setSelectedAddress(null);
                      setLoadedData(null);
                      setSharedMlsData(null);
                      setRevealIndex(-1);
                      setErrorMsg(null);
                    }
                  }}
                  className="bg-lp-card border border-lp-border rounded-lg px-4 py-2.5 text-sm text-lp-smoke focus:border-lp-gold outline-none w-full transition-colors"
                  disabled={loading}
                />
                
                {loadingSuggestions && (
                  <div className="absolute bottom-[2px] left-[2px] right-[2px] h-[2px] overflow-hidden rounded-b-lg pointer-events-none">
                    <motion.div
                      animate={{
                        x: ["-100%", "100%"]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.2,
                        ease: "easeInOut"
                      }}
                      className="w-1/2 h-full bg-lp-gold"
                    />
                  </div>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {(loadingSuggestions || suggestions.length > 0 || noSuggestionsFound) && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-lp-card border border-lp-border rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-lp-border/50 backdrop-blur-md">
                  {loadingSuggestions && (
                    <div className="px-4 py-3 text-xs text-lp-grey italic">
                      Searching addresses...
                    </div>
                  )}
                  {noSuggestionsFound && !loadingSuggestions && (
                    <div className="px-4 py-3 text-xs text-red-400 font-medium">
                      No matches found, try a different address.
                    </div>
                  )}
                  {!loadingSuggestions && suggestions.map((match, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelect(match)}
                      className="w-full text-left px-4 py-2.5 hover:bg-lp-gold/10 text-sm text-lp-smoke hover:text-lp-gold transition-colors cursor-pointer block border-0 bg-transparent font-body"
                    >
                      {match.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handlePullListing}
              disabled={loading || !selectedAddress}
              className="w-full bg-lp-gold text-lp-bg font-semibold rounded-lg px-4 py-2.5 text-sm disabled:opacity-30 hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-lp-bg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Searching NTREIS...
                </>
              ) : (
                "Pull Listing Details"
              )}
            </button>
          </div>

          {/* Results Column */}
          <div className="md:col-span-7 flex flex-col p-6 rounded-2xl bg-lp-card border border-lp-border min-h-[340px] justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-lp-border/50">
                <span className="text-xs font-semibold uppercase tracking-widest text-lp-grey font-body">
                  MLS Fields Auto-populated
                </span>
                {selectedAddress && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-lp-gold/10 text-lp-gold font-medium border border-lp-gold/20">
                    Address Geocoded
                  </span>
                )}
              </div>

              {/* Resolved Census Address Card */}
              {selectedAddress && (
                <div className="p-4 rounded-xl bg-lp-bg border border-lp-border flex flex-col gap-2.5">
                  <span className="text-[10px] uppercase font-bold text-lp-grey tracking-wider">
                    Resolved Census Address Details
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-lp-grey">Address Line 1</span>
                      <span className="text-lp-smoke font-semibold truncate bg-lp-bg-raised px-2.5 py-1.5 rounded border border-lp-border/40">
                        {selectedAddress.line1}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-lp-grey">City</span>
                      <span className="text-lp-smoke font-semibold truncate bg-lp-bg-raised px-2.5 py-1.5 rounded border border-lp-border/40">
                        {selectedAddress.city}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-lp-grey">State</span>
                      <span className="text-lp-smoke font-semibold truncate bg-lp-bg-raised px-2.5 py-1.5 rounded border border-lp-border/40">
                        {selectedAddress.state}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-lp-grey">ZIP Code</span>
                      <span className="text-lp-smoke font-semibold truncate bg-lp-bg-raised px-2.5 py-1.5 rounded border border-lp-border/40">
                        {selectedAddress.zip}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Initial Instructions state */}
              {!loading && !loadedData && (
                <div className="flex flex-col items-center justify-center text-center py-12 gap-2">
                  <svg className="w-8 h-8 text-lp-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-lp-grey text-sm max-w-xs">
                    {!selectedAddress 
                      ? "Search and select a geocoded address on the left to activate MLS capture."
                      : "Address resolved. Click 'Pull Listing Details' to fetch live NTREIS record."
                    }
                  </p>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex flex-col gap-3 py-10 justify-center items-center">
                  <div className="flex space-x-2 justify-center items-center">
                    <div className="h-2 w-2 bg-lp-gold rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 bg-lp-gold rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 bg-lp-gold rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-xs text-lp-grey font-body">Contacting NTREIS Servers...</span>
                </div>
              )}

              {/* Error messages */}
              {!loading && errorMsg && (
                <div className="flex flex-col items-center justify-center text-center py-8 gap-2 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                  <svg className="w-8 h-8 text-red-500/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm font-semibold text-lp-smoke">{errorMsg}</p>
                </div>
              )}

              {/* No match found fallback */}
              {!loading && !errorMsg && loadedData && loadedData.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-10 gap-3 bg-lp-bg-raised/40 rounded-xl p-6 border border-lp-border/50">
                  <svg className="w-8 h-8 text-lp-gold/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lp-grey text-sm max-w-xs font-medium">
                    No active MLS listing found for this address — it may not currently be for sale.
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadDemoProperty}
                    className="bg-lp-gold/15 text-lp-gold hover:bg-lp-gold/20 border border-lp-gold/30 rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer font-sans"
                  >
                    Try our demo property instead
                  </button>
                </div>
              )}

              {/* List display */}
              {!loading && !errorMsg && loadedData && loadedData.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-lp-border/30">
                  <span className="text-[10px] uppercase font-bold text-lp-grey tracking-wider mb-1">
                    Live NTREIS MLS Listing Values
                  </span>
                  <div className="flex flex-col gap-2">
                    {loadedData.map((item, idx) => {
                      const isVisible = idx <= revealIndex && revealIndex >= 0;
                      if (!isVisible) return null;

                      return (
                        <motion.div
                          key={item.label}
                          initial={{ backgroundColor: "rgba(207, 184, 124, 0.4)", opacity: 0, x: -10 }}
                          animate={{ backgroundColor: "rgba(207, 184, 124, 0)", opacity: 1, x: 0 }}
                          transition={{
                            backgroundColor: { duration: 0.9, ease: "easeOut" },
                            opacity: { duration: 0.35 },
                            x: { duration: 0.35 }
                          }}
                          className="px-4 py-2.5 rounded-lg border border-lp-border bg-lp-bg-raised/40 flex justify-between items-center text-sm"
                        >
                          <span className="text-lp-grey font-medium">{item.label}</span>
                          <span className="text-lp-smoke font-semibold">{item.value}</span>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Celebration Indicator */}
                  <AnimatePresence>
                    {showCelebration && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="mt-4 p-3 rounded-lg bg-lp-gold/5 border border-lp-gold/20 flex flex-col items-center justify-center text-center gap-1.5 relative overflow-hidden"
                      >
                        {!prefersReducedMotion && (
                          <motion.div
                            initial={{ opacity: 0.8, scale: 0.8 }}
                            animate={{ opacity: 0, scale: 1.5 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="absolute inset-0 bg-lp-gold/25 rounded-lg pointer-events-none"
                          />
                        )}
                        <span className="text-lp-gold font-display font-semibold text-xs tracking-wider uppercase">
                          See how easy that was?
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Live MLS Disclaimer */}
            <div className="mt-8 pt-4 border-t border-lp-border/60">
              <p className="text-[11px] md:text-xs text-lp-grey font-medium tracking-wide leading-relaxed">
                Live NTREIS MLS data. Properties not currently listed won't return results.
              </p>
            </div>

          </div>

        </div>
      </Reveal>
    </SectionShell>
  );
}
