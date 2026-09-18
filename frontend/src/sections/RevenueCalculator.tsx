import { useState, useEffect } from "react";
import { animate } from "framer-motion";
import { SectionShell } from "@/components/SectionShell";
import { EditorialHeader } from "@/components/EditorialHeader";
import { Reveal } from "@/components/Reveal";
import type { SectionData } from "@/data/content";
import { Tooltip } from "@/components/Tooltip";

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

// Constants from LocalPRO official Revenue Share Policy
interface TierConfig {
  tier: number;
  minAgents: number;
  flatRate: number;
  rateDisplay: string;
  completionBonus: number;
  label: string;
}

const TIER_CONFIG: TierConfig[] = [
  { tier: 1, minAgents: 1, flatRate: 0.2750, rateDisplay: "27.5%", completionBonus: 1000, label: "Tier 1 (1+ referred)" },
  { tier: 2, minAgents: 10, flatRate: 0.1062, rateDisplay: "10.62%", completionBonus: 750, label: "Tier 2 (10+ referred)" },
  { tier: 3, minAgents: 15, flatRate: 0.0375, rateDisplay: "3.75%", completionBonus: 500, label: "Tier 3 (15+ referred)" },
  { tier: 4, minAgents: 20, flatRate: 0.0313, rateDisplay: "3.13%", completionBonus: 750, label: "Tier 4 (20+ referred)" },
  { tier: 5, minAgents: 25, flatRate: 0.0500, rateDisplay: "5.0%", completionBonus: 1000, label: "Tier 5 (25+ referred)" },
];

// Helper function to animate numbers gracefully
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
  const [fullyCappedAgents, setFullyCappedAgents] = useState(0);
  const [capAmount, setCapAmount] = useState(16000);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Update referred agents while ensuring fully capped count doesn't exceed it
  const updateReferredAgents = (val: number) => {
    const nextVal = Math.min(30, Math.max(1, val));
    setReferredAgents(nextVal);
    if (fullyCappedAgents > nextVal) {
      setFullyCappedAgents(nextVal);
    }
  };

  // Determine active tier based on referred agents count
  let activeTierConfig = TIER_CONFIG[0];
  for (const t of TIER_CONFIG) {
    if (referredAgents >= t.minAgents) {
      activeTierConfig = t;
    }
  }
  const activeTier = activeTierConfig.tier;

  // Formula per referred agent and decoupled bonus:
  // pool = capAmount / 2 (50% of whatever cap amount is set)
  // progressPayout = tierRate × pool × (avgCapPercentPaidIn / 100)
  // bonusPayout = fullyCappedAgents × completionBonus[tier]
  // total = (progressPayout × referredAgents) + bonusPayout
  // payoutPerAgent = total / referredAgents
  const effectiveFullyCapped = Math.min(fullyCappedAgents, referredAgents);
  const pool = capAmount / 2;
  const progressPayout = activeTierConfig.flatRate * pool * (capPercent / 100);
  const bonusPayout = effectiveFullyCapped * activeTierConfig.completionBonus;
  const totalPayout = (progressPayout * referredAgents) + bonusPayout;
  const payoutPerAgent = referredAgents > 0 ? totalPayout / referredAgents : 0;

  return (
    <SectionShell id={data.id}>
      <EditorialHeader
        align="center"
        eyebrow={data.eyebrow}
        title={data.title}
        body={"body" in data ? data.body : undefined}
      />

      <DiscoverCue label="Hands-on demo below" prefersReducedMotion={prefersReducedMotion} />

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
                    onChange={(e) => updateReferredAgents(Number(e.target.value))}
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
                onChange={(e) => updateReferredAgents(Number(e.target.value))}
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

            {/* Input 3: Fully Capped Agents */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <label htmlFor="fully-capped-input" className="text-lp-smoke inline-flex items-center gap-1">
                  Fully Capped Agents
                  <Tooltip text="Paid per agent who has fully capped out this year — enter that count above, independent of the group's average progress.">
                    <span className="text-lp-gold select-none font-normal text-[11px] font-body bg-lp-gold/10 px-1 rounded hover:bg-lp-gold/20 transition-colors">ⓘ</span>
                  </Tooltip>
                </label>
                <input
                  id="fully-capped-input"
                  type="number"
                  min="0"
                  max={referredAgents}
                  value={effectiveFullyCapped}
                  onChange={(e) => {
                    const val = e.target.value === "" ? 0 : Number(e.target.value);
                    setFullyCappedAgents(Math.max(0, Math.min(referredAgents, isNaN(val) ? 0 : val)));
                  }}
                  className="w-20 bg-lp-bg border border-lp-border rounded-lg px-3 py-1.5 text-right text-lp-gold focus:border-lp-gold outline-none text-sm font-semibold"
                />
              </div>
              <p className="text-xs text-lp-grey">
                How many of your referred agents have already fully capped out this year — separate from the group average above.
              </p>
            </div>

            {/* Input 4: Cap Amount */}
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
            
            {/* Calculation Breakdown Panel */}
            <div className="mt-4 pt-4 border-t border-lp-border/50">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-lp-grey mb-3">
                Calculation Breakdown (Active Tier {activeTier})
              </h4>
              <div className="flex flex-col gap-2.5 font-body">
                <div className="flex justify-between items-center text-xs py-1 border-b border-lp-border/30">
                  <span className="text-lp-grey">Revenue Share Pool:</span>
                  <span className="text-lp-smoke font-body">
                    ${Math.round(pool).toLocaleString()} <span className="text-lp-grey font-normal">(50% of ${Math.round(capAmount).toLocaleString()} cap)</span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs py-1 border-b border-lp-border/30">
                  <span className="text-lp-grey">Tier {activeTier} Rate:</span>
                  <span className="text-lp-smoke font-body">
                    {activeTierConfig.rateDisplay} &times; ${Math.round(pool).toLocaleString()} &times; {capPercent}% paid in ={" "}
                    <span className="text-lp-gold font-semibold">${Math.round(progressPayout).toLocaleString()}</span>
                    <span className="text-lp-grey font-normal"> / agent</span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs py-1">
                  <span className="text-lp-grey inline-flex items-center gap-1">
                    Completion Bonus:
                    <Tooltip text="Paid per agent who has fully capped out this year — enter that count above, independent of the group's average progress.">
                      <span className="text-lp-gold select-none font-normal text-[11px] font-body bg-lp-gold/10 px-1 rounded hover:bg-lp-gold/20 transition-colors">ⓘ</span>
                    </Tooltip>
                  </span>
                  <span className="text-lp-smoke font-body">
                    {effectiveFullyCapped} fully capped &times; ${activeTierConfig.completionBonus.toLocaleString()} ={" "}
                    <span className="text-lp-gold font-semibold">
                      ${bonusPayout.toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Results Section */}
          <div className="lg:col-span-5 flex flex-col p-6 md:p-8 rounded-2xl bg-lp-card border border-lp-border shadow-2xl relative">
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
                  <Tooltip text="The tier (1–5) determined by your number of active referred agents, which determines the pool flat rate and completion bonus applied.">
                    <span className="text-lp-gold select-none font-normal text-[11px] font-body bg-lp-gold/10 px-1 rounded hover:bg-lp-gold/20 transition-colors">ⓘ</span>
                  </Tooltip>
                </span>
                <span className="text-lp-smoke font-medium">Tier {activeTier}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-lp-grey inline-flex items-center gap-1">
                  Payout Per Agent
                  <Tooltip text="The calculated annual revenue share payout generated from a single referred agent based on their average cap percentage contribution and bonus eligibility.">
                    <span className="text-lp-gold select-none font-normal text-[11px] font-body bg-lp-gold/10 px-1 rounded hover:bg-lp-gold/20 transition-colors">ⓘ</span>
                  </Tooltip>
                </span>
                <span className="text-lp-gold font-semibold">
                  {Math.round(payoutPerAgent).toLocaleString("en-US", {
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

            {/* Policy & illustrative visible disclaimer */}
            <div className="mt-8 pt-4 border-t border-lp-border/60">
              <p className="text-[11px] md:text-xs text-lp-grey font-medium tracking-wide leading-relaxed">
                Illustrative example based on LocalPRO's published rate structure. Final numbers are subject to confirmation and may differ. Revenue share is applied toward your own cap first, before converting to cash — per LocalPRO's official Revenue Share Policy.
              </p>
            </div>

          </div>

        </div>
      </Reveal>
    </SectionShell>
  );
}
