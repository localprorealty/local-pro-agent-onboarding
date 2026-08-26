import { useState, useEffect } from "react";
import { animate } from "framer-motion";
import { SectionShell } from "@/components/SectionShell";
import { EditorialHeader } from "@/components/EditorialHeader";
import { Reveal } from "@/components/Reveal";
import type { SectionData } from "@/data/content";
import { Tooltip } from "@/components/Tooltip";

// Constants from LocalPRO Hub legacy rate table
const TIER_ELIGIBILITY = [
  { tier: 1, minAgents: 1, label: "Tier 1 (1+ referred)" },
  { tier: 2, minAgents: 10, label: "Tier 2 (10+ referred)" },
  { tier: 3, minAgents: 15, label: "Tier 3 (15+ referred)" },
  { tier: 4, minAgents: 20, label: "Tier 4 (20+ referred)" },
  { tier: 5, minAgents: 25, label: "Tier 5 (25+ referred)" },
];

const RATE_MATRIX: Record<number, number[]> = {
  1: [0.05, 0.07, 0.12, 0.16],     // Tier 1 rates per band
  2: [0.02, 0.04, 0.06, 0.08],     // Tier 2 rates per band
  3: [0.01, 0.015, 0.02, 0.035],   // Tier 3 rates per band
  4: [0.01, 0.02, 0.03, 0.06],     // Tier 4 rates per band
  5: [0.01, 0.03, 0.06, 0.10],     // Tier 5 rates per band
};

// Help helper function to animate numbers gracefully
function CountUp({ value }: { value: number }) {
  const [displayVal, setDisplayVal] = useState(value);

  useEffect(() => {
    const controls = animate(displayVal, value, {
      duration: 0.5,
      ease: "easeOut",
      onUpdate: (v) => setDisplayVal(v),
    });
    return () => controls.stop();
  }, [value]);

  return (
    <span>
      {Math.round(displayVal).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      })}
    </span>
  );
}

export function RevenueCalculator({ data }: { data: SectionData }) {
  const [referredAgents, setReferredAgents] = useState(5);
  const [capPercent, setCapPercent] = useState(75);
  const [capAmount, setCapAmount] = useState(16000);

  // Determine active tier based on referred agents count
  let activeTier = 1;
  for (const t of TIER_ELIGIBILITY) {
    if (referredAgents >= t.minAgents) {
      activeTier = t.tier;
    }
  }

  // Calculate portion of cap % in each band (max 25% per band)
  const getBandPortion = (percent: number, bandIndex: number): number => {
    const start = bandIndex * 25;
    const end = start + 25;
    if (percent <= start) return 0;
    if (percent >= end) return 25;
    return percent - start;
  };

  const rates = RATE_MATRIX[activeTier];
  
  // Calculate dollar portion, rate, and payout for each band
  const bandsBreakdown = Array.from({ length: 4 }).map((_, i) => {
    const bandPercent = getBandPortion(capPercent, i);
    const bandDollar = (bandPercent / 100) * capAmount;
    const rate = rates[i];
    const payout = bandDollar * rate;
    const label = i === 0 ? "0–25%" : i === 1 ? "25–50%" : i === 2 ? "50–75%" : "75–100%";
    return { label, bandPercent, bandDollar, rate, payout };
  });

  const payoutPerAgent = bandsBreakdown.reduce((sum, b) => sum + b.payout, 0);
  const totalPayout = payoutPerAgent * referredAgents;

  return (
    <SectionShell id={data.id}>
      <EditorialHeader
        align="center"
        eyebrow={data.eyebrow}
        title={data.title}
        body={"body" in data ? data.body : undefined}
      />

      <Reveal delay={0.2}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12 items-start">
          
          {/* Inputs Section */}
          <div className="lg:col-span-7 flex flex-col gap-6 p-6 md:p-8 rounded-2xl bg-lp-bg-raised border border-lp-border">
            <h3 className="font-display font-semibold text-lg text-lp-smoke">Calculator Parameters</h3>
            
            {/* Input 1: Agents Referred */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <label htmlFor="agents-input" className="text-lp-smoke inline-flex items-center gap-1">
                  Referred Agents
                  <Tooltip text="Active productive agents you personally sponsored into LocalPRO Realty.">
                    <span className="text-lp-gold select-none font-normal text-[11px] font-body bg-lp-gold/10 px-1 rounded hover:bg-lp-gold/20 transition-colors">ⓘ</span>
                  </Tooltip>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-lp-gold/10 text-lp-gold font-body border border-lp-gold/20">
                    Tier {activeTier}
                  </span>
                  <input
                    id="agents-input"
                    type="number"
                    min="1"
                    max="30"
                    value={referredAgents}
                    onChange={(e) => setReferredAgents(Math.min(30, Math.max(1, Number(e.target.value))))}
                    className="w-16 bg-lp-bg border border-lp-border rounded px-2 py-1 text-center text-lp-gold focus:border-lp-gold outline-none text-sm font-semibold"
                  />
                </div>
              </div>
              <input
                id="agents-slider"
                type="range"
                min="1"
                max="30"
                value={referredAgents}
                onChange={(e) => setReferredAgents(Number(e.target.value))}
                className="w-full accent-lp-gold cursor-pointer bg-lp-border rounded-lg appearance-none h-2"
                aria-label="Referred Agents Slider"
              />
              <div className="flex justify-between text-[10px] text-lp-grey font-body mt-0.5">
                <span>1 Agent</span>
                <span>Tier 2 (10)</span>
                <span>Tier 3 (15)</span>
                <span>Tier 4 (20)</span>
                <span>Tier 5 (25+)</span>
              </div>
            </div>

            {/* Input 2: Average Cap Contribution % */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <label htmlFor="cap-percent-input" className="text-lp-smoke inline-flex items-center gap-1">
                  Average % of Cap Paid In
                  <Tooltip text="The average percentage of the annual cap amount that your referred agents reach before their anniversary year resets.">
                    <span className="text-lp-gold select-none font-normal text-[11px] font-body bg-lp-gold/10 px-1 rounded hover:bg-lp-gold/20 transition-colors">ⓘ</span>
                  </Tooltip>
                </label>
                <span className="text-lp-gold font-semibold font-body">{capPercent}%</span>
              </div>
              <input
                id="cap-percent-slider"
                type="range"
                min="0"
                max="100"
                value={capPercent}
                onChange={(e) => setCapPercent(Number(e.target.value))}
                className="w-full accent-lp-gold cursor-pointer bg-lp-border rounded-lg appearance-none h-2"
                aria-label="Average Cap Percentage Slider"
              />
              <div className="flex justify-between text-[10px] text-lp-grey font-body mt-0.5">
                <span>0% (No production)</span>
                <span>50%</span>
                <span>100% (Full Cap)</span>
              </div>
            </div>

            {/* Input 3: Cap Amount */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <label htmlFor="cap-amount-input" className="text-lp-smoke">Cap Amount Per Agent</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lp-grey text-sm">$</span>
                  <input
                    id="cap-amount-input"
                    type="number"
                    step="1000"
                    value={capAmount}
                    onChange={(e) => setCapAmount(Math.max(0, Number(e.target.value)))}
                    className="w-32 bg-lp-bg border border-lp-border rounded-lg pl-6 pr-3 py-1.5 text-right text-lp-gold focus:border-lp-gold outline-none text-sm font-semibold"
                  />
                </div>
              </div>
              <p className="text-xs text-lp-grey">
                Default split cap contribution limit. Editable to match specific office rates.
              </p>
            </div>
            
            {/* Custom Bands Breakdown (Transparency value-add) */}
            <div className="mt-4 pt-4 border-t border-lp-border/50">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-lp-grey mb-3">
                Calculation Breakdown (Active Tier {activeTier})
              </h4>
              <div className="flex flex-col gap-2">
                {bandsBreakdown.map((b, i) => (
                  <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-lp-border/30 last:border-0">
                    <span className="text-lp-grey">{b.label} Band:</span>
                    <span className="text-lp-smoke font-body">
                      {b.bandPercent > 0 ? (
                        <>
                          {(b.bandPercent * 4).toFixed(0)}% paid ({Math.round(b.bandPercent * 4)}% of band) &times; {(b.rate * 100).toFixed(1)}% = <span className="text-lp-gold font-semibold">${Math.round(b.payout).toLocaleString()}</span>
                        </>
                      ) : (
                        <span className="text-lp-grey/50">Not reached</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Results Section */}
          <div className="lg:col-span-5 flex flex-col p-6 md:p-8 rounded-2xl bg-lp-card border border-lp-border shadow-2xl relative overflow-hidden">
            {/* Ambient Background Glow behind total */}
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-lp-gold/5 blur-3xl pointer-events-none" />
            
            <span className="text-xs font-semibold uppercase tracking-widest text-lp-grey inline-flex items-center gap-1">
              Estimated Annual Payout
              <Tooltip text="The total projected revenue share you could earn annually, calculated as: referred agents × payout per agent.">
                <span className="text-lp-gold select-none font-normal text-[11px] font-body bg-lp-gold/10 px-1 rounded hover:bg-lp-gold/20 transition-colors">ⓘ</span>
              </Tooltip>
            </span>
            
            <div className="mt-4 text-5xl md:text-6xl font-display font-extrabold text-lp-gold leading-none">
              <CountUp value={totalPayout} />
            </div>

            <div className="mt-6 flex flex-col gap-3 pt-6 border-t border-lp-border/60">
              <div className="flex justify-between items-center text-sm">
                <span className="text-lp-grey inline-flex items-center gap-1">
                  Qualifying Level
                  <Tooltip text="The tier (1–5) determined by your number of active referred agents, which determines the rate matrix used.">
                    <span className="text-lp-gold select-none font-normal text-[11px] font-body bg-lp-gold/10 px-1 rounded hover:bg-lp-gold/20 transition-colors">ⓘ</span>
                  </Tooltip>
                </span>
                <span className="text-lp-smoke font-medium">Tier {activeTier}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-lp-grey inline-flex items-center gap-1">
                  Payout Per Agent
                  <Tooltip text="The calculated annual revenue share payout generated from a single referred agent based on their average cap percentage contribution.">
                    <span className="text-lp-gold select-none font-normal text-[11px] font-body bg-lp-gold/10 px-1 rounded hover:bg-lp-gold/20 transition-colors">ⓘ</span>
                  </Tooltip>
                </span>
                <span className="text-lp-gold font-semibold">
                  {payoutPerAgent.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })} / yr
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-lp-grey">Referred Agents</span>
                <span className="text-lp-smoke font-medium">{referredAgents}</span>
              </div>
            </div>

            {/* Micro progress bar for referred agents */}
            <div className="mt-6">
              <div className="flex justify-between text-[10px] text-lp-grey mb-1">
                <span>Progress to Next Tier</span>
                <span>{referredAgents} / 30</span>
              </div>
              <div className="w-full bg-lp-bg rounded-full h-1.5 overflow-hidden border border-lp-border">
                <div
                  className="bg-lp-gold h-full rounded-full transition-all duration-300"
                  style={{ width: `${(referredAgents / 30) * 100}%` }}
                />
              </div>
            </div>

            {/* Non-negotiable visible caption, styled clearly, not hidden */}
            <div className="mt-8 pt-4 border-t border-lp-border/60">
              <p className="text-[11px] md:text-xs text-lp-grey font-medium tracking-wide leading-relaxed">
                Illustrative example based on LocalPRO's published rate structure. Final numbers are subject to confirmation and may differ.
              </p>
            </div>

          </div>

        </div>
      </Reveal>
    </SectionShell>
  );
}
