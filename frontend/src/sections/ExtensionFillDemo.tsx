import { useState, useEffect } from "react";
import { SectionShell } from "@/components/SectionShell";
import { EditorialHeader } from "@/components/EditorialHeader";
import type { SectionData } from "@/data/content";

interface ExtensionFillDemoProps {
  data: SectionData;
  sharedMlsData: any | null;
}

const SAMPLE_LISTING = {
  "Property Type": "Single Family Home",
  Bedrooms: "4",
  Bathrooms: "3.5",
  "Square Footage": "3,250 sqft",
  "Lot Size": "0.34 acres",
  "Year Built": "2018",
  "List Price": "$675,000",
  "Estimated List Price": "$675,000",
};

export function ExtensionFillDemo({ data, sharedMlsData }: ExtensionFillDemoProps) {
  const [activeProperty, setActiveProperty] = useState<any | null>(null);

  // Autofill states for fields
  const [propertySubType, setPropertySubType] = useState("");
  const [housingType, setHousingType] = useState<string[]>([]);
  const [yearBuilt, setYearBuilt] = useState("");
  const [livingArea, setLivingArea] = useState("");
  const [listPrice, setListPrice] = useState("");
  
  // Highlight flash flags
  const [activeFlashes, setActiveFlashes] = useState<Record<string, boolean>>({});
  const [autofillProgress, setAutofillProgress] = useState<"idle" | "running" | "completed">("idle");
  const [autofillMessage, setAutofillMessage] = useState("");

  // Sync with shared MLS state if looked up
  useEffect(() => {
    if (sharedMlsData) {
      setActiveProperty(sharedMlsData);
    }
  }, [sharedMlsData]);

  useEffect(() => {
    if (!activeProperty) {
      // Reset form if data is cleared
      setPropertySubType("");
      setHousingType([]);
      setYearBuilt("");
      setLivingArea("");
      setListPrice("");
      setAutofillProgress("idle");
      setAutofillMessage("Extension standby — waiting for MLS data fetch above");
      return;
    }

    // Trigger autofill sequence
    setAutofillProgress("running");
    setAutofillMessage("Extension connected. Reading MLS record...");

    const runSequence = async () => {
      const flash = (field: string, ms = 800) => {
        setActiveFlashes((prev) => ({ ...prev, [field]: true }));
        setTimeout(() => {
          setActiveFlashes((prev) => ({ ...prev, [field]: false }));
        }, ms);
      };

      // Delay 1: Property Sub Type
      await new Promise((r) => setTimeout(r, 600));
      setAutofillMessage("Autofilling Property Sub Type...");
      setPropertySubType(activeProperty["Property Type"] || "Single Family Residence");
      flash("propertySubType");

      // Delay 2: Housing Type checkbox
      await new Promise((r) => setTimeout(r, 600));
      setAutofillMessage("Checking housing classification...");
      const ptype = (activeProperty["Property Type"] || "").toLowerCase();
      if (ptype.includes("condo") || ptype.includes("townhouse")) {
        setHousingType(["Townhouse", "Condo"]);
      } else {
        setHousingType(["Single Detached"]);
      }
      flash("housingType");

      // Delay 3: Year Built
      await new Promise((r) => setTimeout(r, 600));
      setAutofillMessage("Writing Year Built...");
      setYearBuilt(activeProperty["Year Built"] || "N/A");
      flash("yearBuilt");

      // Delay 4: Living Area SqFt
      await new Promise((r) => setTimeout(r, 600));
      setAutofillMessage("Writing living area SqFt...");
      const rawSqFt = activeProperty["Square Footage"] || "";
      setLivingArea(rawSqFt.replace(/ sqft/gi, ""));
      flash("livingArea");

      // Delay 5: List Price
      await new Promise((r) => setTimeout(r, 600));
      setAutofillMessage("Setting Listing Price...");
      setListPrice(activeProperty["Estimated List Price"] || activeProperty["List Price"] || "");
      flash("listPrice");

      // Finished
      await new Promise((r) => setTimeout(r, 400));
      setAutofillProgress("completed");
      setAutofillMessage("Form Autofill Completed! 5 fields synchronized successfully.");
    };

    runSequence();
  }, [activeProperty]);

  const isFlashing = (field: string) => !!activeFlashes[field];

  return (
    <SectionShell id={data.id}>
      <EditorialHeader
        align="center"
        eyebrow={data.eyebrow}
        title={data.title}
        body={"body" in data ? data.body : undefined}
      />

      <div className="mt-12 max-w-5xl mx-auto">
        {/* Browser Window Mockup Frame */}
        <div className="rounded-2xl border border-lp-border bg-lp-card shadow-2xl overflow-hidden flex flex-col min-h-[580px] relative">
          
          {/* Browser Header Bar */}
          <div className="bg-[#121214] px-4 py-3 flex items-center gap-3 border-b border-lp-border/40 select-none">
            {/* Window control circles */}
            <div className="flex gap-1.5 shrink-0">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            
            {/* Mock address bar */}
            <div className="flex-grow max-w-lg mx-auto bg-lp-bg border border-lp-border/60 rounded-md py-1 px-3 text-xs text-lp-grey font-mono select-all flex items-center justify-between">
              <span>https://ntrdd.mlsmatrix.com/Matrix/Input/InputForm.aspx?type=residential</span>
              <svg className="w-3.5 h-3.5 text-lp-grey opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            {/* Extension indicator pill */}
            <div className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 transition-all duration-300 ${
              autofillProgress === "running" ? "bg-lp-gold/20 text-lp-gold border border-lp-gold/40 animate-pulse" :
              autofillProgress === "completed" ? "bg-green-500/20 text-green-400 border border-green-500/40" :
              "bg-lp-bg-raised text-lp-grey border border-lp-border"
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                autofillProgress === "running" ? "bg-lp-gold animate-ping" :
                autofillProgress === "completed" ? "bg-green-400" : "bg-lp-grey"
              }`} />
              <span>LocalPRO Extension</span>
            </div>
          </div>

          {/* NTREIS Matrix Branding Header */}
          <div className="bg-[#002f5e] text-white flex flex-col shrink-0 select-none">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-lg tracking-wider text-white">NTREIS</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-[#f6b426] text-[#002f5e] rounded-sm font-sans uppercase">Matrix™</span>
              </div>
              <div className="flex gap-5 text-[11px] font-bold text-white/80 uppercase">
                <span>MY MATRIX</span>
                <span>SEARCH</span>
                <span>STATS</span>
                <span>TAX</span>
                <span className="text-[#f6b426] border-b-2 border-[#f6b426] pb-0.5">INPUT</span>
                <span>LINKS</span>
              </div>
            </div>
            {/* Matrix Form Sub Bar */}
            <div className="bg-[#e9eff7] text-[#333333] px-5 py-2 text-xs font-bold border-b border-[#bdcddc] flex items-center justify-between">
              <span>Input / Add New Listing / Residential</span>
              <div className="text-[10px] text-lp-grey bg-white/70 border border-[#bdcddc] px-2 py-0.5 rounded">
                Server Status: ONLINE
              </div>
            </div>
          </div>

          {/* Matrix Inner Workspace Panel */}
          <div className="bg-[#fcfdfd] text-[#222222] p-5 flex flex-col flex-grow relative overflow-y-auto font-sans">
            
            {/* Matrix Tab Strip */}
            <div className="flex border-b border-[#c8d4df] text-xs font-semibold mb-6 select-none shrink-0">
              <div className="px-4 py-2 border-l border-t border-r border-[#c8d4df] bg-white text-[#002f5e] -mb-[1px] relative z-10 rounded-t-sm border-t-2 border-t-[#002f5e]">
                Property Info
              </div>
              <div className="px-4 py-2 text-lp-grey/80 cursor-not-allowed">Location</div>
              <div className="px-4 py-2 text-lp-grey/80 cursor-not-allowed">Land & Exterior</div>
              <div className="px-4 py-2 text-lp-grey/80 cursor-not-allowed">Rooms</div>
              <div className="px-4 py-2 text-lp-grey/80 cursor-not-allowed">Financial & Schools</div>
              <div className="px-4 py-2 text-lp-grey/80 cursor-not-allowed">Remarks</div>
            </div>

            {/* Matrix Simulated Form */}
            <div className="flex-grow flex flex-col justify-between">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                
                {/* Field 1: Property Sub Type (Khaki Mandatory) */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 select-none">
                    <span className="text-red-600 font-bold text-xs">*</span>
                    <label className="text-xs font-bold text-[#333333]">Property Sub Type</label>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={propertySubType}
                    placeholder="Select Property Classification..."
                    className={`border text-sm px-3 py-1.5 rounded outline-none font-sans font-medium transition-all duration-300 w-full ${
                      isFlashing("propertySubType") ? "bg-lp-gold/30 border-lp-gold ring-2 ring-lp-gold/40 text-[#111111]" :
                      propertySubType ? "bg-white border-[#b0c0d0] text-[#111111]" : "bg-[#f5f2db] border-[#cfc89d] text-lp-grey/50 italic"
                    }`}
                  />
                </div>

                {/* Field 2: Housing Type checkboxes */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 select-none">
                    <span className="text-red-600 font-bold text-xs">*</span>
                    <label className="text-xs font-bold text-[#333333]">Housing Type (Select Group)</label>
                  </div>
                  <div className={`p-3 border rounded transition-all duration-300 grid grid-cols-2 gap-2 ${
                    isFlashing("housingType") ? "bg-lp-gold/30 border-lp-gold ring-2 ring-lp-gold/40" :
                    housingType.length > 0 ? "bg-white border-[#b0c0d0]" : "bg-[#f5f2db] border-[#cfc89d]"
                  }`}>
                    {["Single Detached", "Condo/Townhouse", "Attached", "Garden/Zero Lot"].map((label) => {
                      const isChecked = housingType.some(
                        (item) => item.toLowerCase() === label.toLowerCase() || 
                        (label.includes("/") && label.split("/").some(pt => item.toLowerCase().includes(pt.toLowerCase())))
                      );
                      return (
                        <label key={label} className="flex items-center gap-2 text-xs font-medium text-[#444444] cursor-not-allowed select-none">
                          <input
                            type="checkbox"
                            disabled
                            checked={isChecked}
                            className="rounded border-[#b0c0d0] text-[#002f5e]"
                          />
                          <span>{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Field 3: Year Built (Khaki Mandatory) */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 select-none">
                    <span className="text-red-600 font-bold text-xs">*</span>
                    <label className="text-xs font-bold text-[#333333]">Year Built</label>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={yearBuilt}
                    placeholder="YYYY"
                    className={`border text-sm px-3 py-1.5 rounded outline-none font-sans font-medium transition-all duration-300 w-full ${
                      isFlashing("yearBuilt") ? "bg-lp-gold/30 border-lp-gold ring-2 ring-lp-gold/40 text-[#111111]" :
                      yearBuilt ? "bg-white border-[#b0c0d0] text-[#111111]" : "bg-[#f5f2db] border-[#cfc89d] text-lp-grey/50"
                    }`}
                  />
                </div>

                {/* Field 4: SqFt Living Area (Khaki Mandatory) */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 select-none">
                    <span className="text-red-600 font-bold text-xs">*</span>
                    <label className="text-xs font-bold text-[#333333]">SqFt / Living Area Total</label>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={livingArea}
                    placeholder="SqFt"
                    className={`border text-sm px-3 py-1.5 rounded outline-none font-sans font-medium transition-all duration-300 w-full ${
                      isFlashing("livingArea") ? "bg-lp-gold/30 border-lp-gold ring-2 ring-lp-gold/40 text-[#111111]" :
                      livingArea ? "bg-white border-[#b0c0d0] text-[#111111]" : "bg-[#f5f2db] border-[#cfc89d] text-lp-grey/50"
                    }`}
                  />
                </div>

                {/* Field 5: List Price (Khaki Mandatory) */}
                <div className="flex flex-col gap-1 md:col-span-2">
                  <div className="flex items-center gap-1.5 select-none">
                    <span className="text-red-600 font-bold text-xs">*</span>
                    <label className="text-xs font-bold text-[#333333]">Listing List Price</label>
                  </div>
                  <div className="relative w-full">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#555555]">$</span>
                    <input
                      type="text"
                      readOnly
                      value={listPrice.replace("$", "")}
                      placeholder="List Price amount"
                      className={`border text-sm pl-7 pr-3 py-1.5 rounded outline-none font-sans font-bold transition-all duration-300 w-full ${
                        isFlashing("listPrice") ? "bg-lp-gold/30 border-lp-gold ring-2 ring-lp-gold/40 text-[#111111]" :
                        listPrice ? "bg-white border-[#b0c0d0] text-[#111111]" : "bg-[#f5f2db] border-[#cfc89d] text-lp-grey/50"
                      }`}
                    />
                  </div>
                </div>

              </div>

              {/* Form Footer Action Buttons */}
              <div className="mt-12 pt-4 border-t border-[#d8e0e6] flex items-center justify-between select-none">
                <span className="text-[10px] text-lp-grey font-medium uppercase font-sans">
                  * Indicates required field. Form will block validation if incomplete.
                </span>
                <div className="flex gap-2.5 text-xs font-bold">
                  <button type="button" disabled className="px-4 py-1.5 bg-[#f0f4f8] border border-[#b8c9d9] text-[#002f5e] rounded cursor-not-allowed">
                    Save as Draft
                  </button>
                  <button type="button" disabled className="px-4 py-1.5 bg-[#f0f4f8] border border-[#b8c9d9] text-[#002f5e] rounded cursor-not-allowed">
                    Validate
                  </button>
                  <button type="button" disabled className="px-5 py-1.5 bg-[#002f5e] text-white border border-[#002f5e] rounded cursor-not-allowed">
                    Submit Listing
                  </button>
                </div>
              </div>

            </div>

            {/* Empty Form / Standby Blur Overlay */}
            {!activeProperty && (
              <div className="absolute inset-0 bg-[#fcfdfd]/95 backdrop-blur-[2px] flex items-center justify-center p-6 text-center select-none z-20 font-sans">
                <div className="max-w-md flex flex-col items-center gap-3 bg-white border border-[#bdcddc] rounded-xl shadow-xl p-8">
                  <svg className="w-10 h-10 text-lp-gold/70 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <h4 className="font-display font-semibold text-base text-[#111111]">Extension Autofill Standby</h4>
                  <p className="text-xs text-[#555555] leading-relaxed">
                    No active MLS property detected. Look up an address in the demo section above, or load our sample listing to proceed.
                  </p>
                  <button
                    onClick={() => setActiveProperty(SAMPLE_LISTING)}
                    className="mt-2 bg-lp-gold/15 text-lp-gold hover:bg-lp-gold/20 border border-lp-gold/30 rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer font-sans"
                  >
                    Load Sample Listing
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Extension overlay progress hud (only visible when data is active) */}
          {activeProperty && (
            <div className={`px-4 py-2 border-t text-xs font-semibold font-body select-none flex items-center justify-between ${
              autofillProgress === "running" ? "bg-lp-gold/10 text-lp-gold border-lp-gold/20" :
              autofillProgress === "completed" ? "bg-green-500/10 text-green-400 border-green-500/20" :
              "bg-lp-bg-raised text-lp-grey border-lp-border"
            }`}>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  {autofillProgress === "running" && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lp-gold opacity-75" />
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    autofillProgress === "running" ? "bg-lp-gold" :
                    autofillProgress === "completed" ? "bg-green-400" : "bg-lp-grey"
                  }`} />
                </span>
                <span>{autofillMessage}</span>
              </div>
              {autofillProgress === "running" && (
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-lp-gold animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-lp-gold animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-lp-gold animate-bounce" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
