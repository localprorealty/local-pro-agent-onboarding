import { useState, useEffect, useRef } from "react";
import { useMotionValue, useSpring, motion, useScroll, AnimatePresence } from "framer-motion";
import { useLenis } from "@/lib/useLenis";
import { SECTIONS, type SectionData } from "@/data/content";
import { SectionRouter } from "@/sections/SectionRouter";
import { NorthDock } from "@/components/NorthDock/NorthDock";
import { ScrollProgress } from "@/components/ScrollProgress";
import { GoogleAuthProvider } from "@/context/GoogleAuthContext";
import { BrandingBar } from "@/components/BrandingBar";

export default function App() {
  useLenis();
  const [sharedMlsData, setSharedMlsData] = useState<any | null>(null);
  const [showCursor, setShowCursor] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hideScrollCue, setHideScrollCue] = useState(false);
  const [lenisInstance, setLenisInstance] = useState<any | null>(null);
  const lenisRef = useRef<any>(null);
  const prefersReducedMotionRef = useRef(false);

  const [isCreepPausedUser, setIsCreepPausedUser] = useState(false);
  const isCreepPausedUserRef = useRef(false);
  const [debugGaps, setDebugGaps] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("debug") === "gaps") {
      setDebugGaps(true);
    }
  }, []);

  useEffect(() => {
    isCreepPausedUserRef.current = isCreepPausedUser;
  }, [isCreepPausedUser]);

  const handleToggleAutoScroll = () => {
    setIsCreepPausedUser((prev) => {
      const next = !prev;
      if (next) {
        window.dispatchEvent(new CustomEvent("pause-creep"));
      } else {
        window.dispatchEvent(new CustomEvent("resume-creep"));
      }
      return next;
    });
  };

  useEffect(() => {
    lenisRef.current = lenisInstance;
  }, [lenisInstance]);

  useEffect(() => {
    prefersReducedMotionRef.current = prefersReducedMotion;
  }, [prefersReducedMotion]);

  const { scrollYProgress } = useScroll();

  // Mouse coordinates using MotionValues
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth springs for cursor follow
  const springConfig = { damping: 25, stiffness: 250 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Disable custom cursor on touch devices or small viewports
    const checkDevice = () => {
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isSmall = window.innerWidth < 768;
      setShowCursor(!hasTouch && !isSmall);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    const handleMouseMove = (e: MouseEvent) => {
      // Offset by half of cursor size (20px / 2 = 10px) to center it
      mouseX.set(e.clientX - 10);
      mouseY.set(e.clientY - 10);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", checkDevice);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [mouseX, mouseY]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, []);

  useEffect(() => {
    return scrollYProgress.onChange((latest) => {
      // Hide only when reaching the end of the page (95% or more scroll progress)
      if (latest > 0.95) {
        setHideScrollCue(true);
      } else {
        setHideScrollCue(false);
      }
    });
  }, [scrollYProgress]);

  // Capture lenis instance from window
  useEffect(() => {
    const interval = setInterval(() => {
      const lenis = (window as any).lenisInstance;
      if (lenis) {
        setLenisInstance(lenis);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Settle-on-idle scroll snapping
  useEffect(() => {
    if (!lenisInstance) return;

    let isSnapping = false;
    let snapTimeout: any;

    const handleScroll = (e: any) => {
      clearTimeout(snapTimeout);
      if (isSnapping) return;

      const velocity = Math.abs(e.velocity);
      const scroll = e.scroll;

      if (velocity < 0.15) {
        snapTimeout = setTimeout(() => {
          if (isSnapping) {
            console.log("[AUTO-SCROLL DEBUG] already snapping, skipping snap check");
            return;
          }

          const vh = window.innerHeight;
          const threshold = 0.18 * vh;

          // Find all section boundaries
          const sections = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
          const targets: number[] = [];
          sections.forEach((el) => {
            targets.push(el.offsetTop);
            targets.push(el.offsetTop + el.offsetHeight);
          });
          const uniqueTargets = Array.from(new Set(targets)).sort((a, b) => a - b);

          let closest = uniqueTargets[0];
          let minDiff = Math.abs(scroll - closest);

          for (let i = 1; i < uniqueTargets.length; i++) {
            const diff = Math.abs(scroll - uniqueTargets[i]);
            if (diff < minDiff) {
              minDiff = diff;
              closest = uniqueTargets[i];
            }
          }

          console.log(`[AUTO-SCROLL DEBUG] snap check: scroll: ${scroll.toFixed(1)}, closest: ${closest}, minDiff: ${minDiff.toFixed(1)}, threshold: ${threshold.toFixed(1)}`);

          if (minDiff > 2 && minDiff < threshold) {
            console.log(`[AUTO-SCROLL DEBUG] snapping: triggering scrollTo to ${closest} (diff: ${minDiff.toFixed(1)})`);
            isSnapping = true;
            lenisInstance.scrollTo(closest, {
              duration: 0.7,
              easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
              onComplete: () => {
                console.log("[AUTO-SCROLL DEBUG] snap complete");
                isSnapping = false;
              },
            });
          }
        }, 150);
      }
    };

    lenisInstance.on("scroll", handleScroll);

    return () => {
      lenisInstance.off("scroll", handleScroll);
      clearTimeout(snapTimeout);
    };
  }, [lenisInstance]);

  // Gentle auto-advance for users who stop interacting for an extended period
  useEffect(() => {
    let idleTimeout: any = null;
    let creepFrameId: number | null = null;
    let lastX = -1;
    let lastY = -1;
    const isCreepActiveRef = { current: false };

    const isUserInExclusionZone = () => {
      let activeSectionId = "unknown";
      const vh = window.innerHeight;
      const allSections = document.querySelectorAll('section, [id]');
      for (const el of Array.from(allSections)) {
        if (el.id) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= vh / 2 && rect.bottom >= vh / 2) {
            activeSectionId = el.id;
            break;
          }
        }
      }

      // 0. Check if user paused creep manually
      if (isCreepPausedUserRef.current) {
        console.log(`[AUTO-SCROLL DEBUG] paused: manual pause. scrollY: ${window.scrollY}, activeSection: ${activeSectionId}`);
        return true;
      }

      // 1. Check if chat panel is open (only matches the dialog when active, not the persistent dock button)
      const isChatOpen = !!document.querySelector('div[role="dialog"][aria-label="Chat with North"]');
      if (isChatOpen) {
        console.log(`[AUTO-SCROLL DEBUG] paused: chat panel open. scrollY: ${window.scrollY}, activeSection: ${activeSectionId}`);
        return true;
      }

      // 2. Check if any input or interactive element is focused inside these sections
      const active = document.activeElement;
      if (
        active &&
        active.closest("#revenue-calculator, #platform-demo, #ai-marketing, #form, #close")
      ) {
        console.log(`[AUTO-SCROLL DEBUG] paused: interactive focus inside ${active.closest("#revenue-calculator, #platform-demo, #ai-marketing, #form, #close")?.id}. focused element:`, active, `scrollY: ${window.scrollY}, activeSection: ${activeSectionId}`);
        return true;
      }

      // 4. Check if any gated video's section is active and the video has not ended
      const gatedVideos = document.querySelectorAll('video[data-gates-scroll="true"]');
      for (const video of Array.from(gatedVideos) as HTMLVideoElement[]) {
        if (!video.ended) {
          const sectionEl = video.closest('section');
          if (sectionEl) {
            const rect = sectionEl.getBoundingClientRect();
            // Check if section is active (occupies center of viewport)
            const isSectionActive = rect.top <= vh / 2 && rect.bottom >= vh / 2;
            
            // For the Hero section (id="open"), calculate scroll progress mathematically
            // to allow the opening brand logo and text reveals to play before halting.
            // Halt only when scroll progress reaches the video moment (>= 0.58).
            if (sectionEl.id === "open") {
              const maxScroll = rect.height - vh;
              const progress = maxScroll > 0 ? -rect.top / maxScroll : 0;
              if (isSectionActive && progress >= 0.58) {
                const videoRect = video.getBoundingClientRect();
                console.log(`[AUTO-SCROLL DEBUG] paused: Hero video active (progress: ${progress.toFixed(2)}). scrollY: ${window.scrollY}, activeSection: ${activeSectionId}, videoRect:`, { top: videoRect.top, left: videoRect.left, width: videoRect.width, height: videoRect.height });
                return true;
              }
            } else {
              // For other sections, block immediately when the section becomes active
              if (isSectionActive) {
                const videoRect = video.getBoundingClientRect();
                console.log(`[AUTO-SCROLL DEBUG] paused: Gated video in section ${sectionEl.id} is active. scrollY: ${window.scrollY}, activeSection: ${activeSectionId}, videoRect:`, { top: videoRect.top, left: videoRect.left, width: videoRect.width, height: videoRect.height });
                return true;
              }
            }
          }
        }
      }

      return false;
    };

    const creepScroll = () => {
      if (!isCreepActiveRef.current) return;

      const lenis = lenisRef.current;
      const prefersReduced = prefersReducedMotionRef.current;
      const isExcl = isUserInExclusionZone();

      if (lenis && !prefersReduced && !isExcl) {
        const currentScroll = lenis.scroll;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

        // Determine active section, its height, and creepSpeedMultiplier
        let activeMultiplier = 1.0;
        let sectionHeight = window.innerHeight; // Default fallback to 1 vh
        let activeSection: SectionData = SECTIONS[0];

        for (const section of SECTIONS) {
          const el = document.getElementById(section.id);
          if (el) {
            const rect = el.getBoundingClientRect();
            const vh = window.innerHeight;
            // If the section occupies the center of the viewport
            if (rect.top <= vh / 2 && rect.bottom >= vh / 2) {
              activeMultiplier = (section as any).creepSpeedMultiplier ?? 1.0;
              sectionHeight = el.offsetHeight || rect.height || vh;
              activeSection = section;
              break;
            }
          }
        }

        // Part 3a: Runtime getBoundingClientRect log for active video
        const activeSectionEl = document.getElementById(activeSection.id);
        if (activeSectionEl) {
          const videoInActiveSection = activeSectionEl.querySelector('video');
          if (videoInActiveSection) {
            const vRect = videoInActiveSection.getBoundingClientRect();
            console.log(`[AUTO-SCROLL DEBUG] Video in active section ${activeSection.id} rect:`, {
              top: vRect.top,
              left: vRect.left,
              bottom: vRect.bottom,
              right: vRect.right,
              width: vRect.width,
              height: vRect.height,
              viewportWidth: window.innerWidth,
              viewportHeight: window.innerHeight
            });
          }
        }

        // Count words in active section (eyebrow, title, body, sub, lists)
        let textToCount = "";
        textToCount += ` ${(activeSection as any).eyebrow ?? ""}`;
        textToCount += ` ${(activeSection as any).title ?? ""}`;
        textToCount += ` ${(activeSection as any).body ?? ""}`;
        textToCount += ` ${(activeSection as any).sub ?? ""}`;

        if ("items" in activeSection && Array.isArray((activeSection as any).items)) {
          for (const item of (activeSection as any).items) {
            textToCount += ` ${item.detail ?? ""}`;
          }
        }
        if ("heart" in activeSection && Array.isArray((activeSection as any).heart)) {
          for (const item of (activeSection as any).heart) {
            textToCount += ` ${item.detail ?? ""}`;
          }
        }

        const words = textToCount.trim().split(/\s+/).filter(Boolean);
        const wordCount = words.length;

        // Estimated reading time: 200 words/minute baseline with a 4-second floor
        const readingTimeSeconds = Math.max(4, (wordCount / 200) * 60);

        // Speed = height / time, clamped between 20px/s and 150px/s
        const calculatedSpeed = sectionHeight / readingTimeSeconds;
        const speed = Math.min(150, Math.max(20, calculatedSpeed));

        // Apply manual override multiplier
        const finalSpeed = speed * activeMultiplier;
        const distance = 250; // px per chunk
        const duration = distance / finalSpeed; // in seconds

        if (currentScroll < maxScroll - 5) {
          // Linear scroll by 250px over calculated duration for absolute smooth constant velocity
          lenis.scrollTo(currentScroll + 250, {
            duration: duration,
            easing: (t: number) => t, // Linear easing
            onComplete: () => {
              if (isCreepActiveRef.current) {
                creepScroll();
              }
            }
          });
        } else {
          stopCreep();
        }
      } else {
        if (!lenis) {
          console.log("[AUTO-SCROLL] Creep paused: Lenis instance not ready");
        } else if (prefersReduced) {
          console.log("[AUTO-SCROLL] Creep paused: prefers-reduced-motion is active");
        }
        // If paused due to exclusion zone, check again in 500ms
        creepFrameId = window.setTimeout(() => {
          if (isCreepActiveRef.current) {
            creepScroll();
          }
        }, 500);
      }
    };

    const startCreep = () => {
      if (isCreepPausedUserRef.current) return;
      if (isCreepActiveRef.current) return;
      isCreepActiveRef.current = true;
      creepScroll();
    };

    const stopCreep = () => {
      if (isCreepActiveRef.current) {
        isCreepActiveRef.current = false;
        if (creepFrameId !== null) {
          cancelAnimationFrame(creepFrameId);
          clearTimeout(creepFrameId);
          creepFrameId = null;
        }
        const lenis = lenisRef.current;
        if (lenis) {
          lenis.stop();
          lenis.start();
        }
      }
    };

    const resetIdleTimer = () => {
      stopCreep();

      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }

      idleTimeout = setTimeout(() => {
        startCreep();
      }, 3000); // 3 seconds delay
    };

    const handleActivity = () => {
      resetIdleTimer();
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Ignore initial dummy/scroll-induced mousemove events if position hasn't actually changed
      if (e.clientX === lastX && e.clientY === lastY) return;
      lastX = e.clientX;
      lastY = e.clientY;
      handleActivity();
    };

    const handleVideoEnded = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      if (
        target &&
        target.tagName === "VIDEO" &&
        target.getAttribute("data-gates-scroll") === "true"
      ) {
        console.log("[AUTO-SCROLL] Gated video ended. Resuming creep immediately.");
        if (idleTimeout) {
          clearTimeout(idleTimeout);
        }
        startCreep();
      }
    };

    const handleResumeCreep = () => {
      console.log("[AUTO-SCROLL] Manual resume requested. Starting creep.");
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }
      startCreep();
    };

    const handlePauseCreep = () => {
      console.log("[AUTO-SCROLL] Manual pause requested. Stopping creep.");
      stopCreep();
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }
    };

    // Listen to standard interaction events
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("wheel", handleActivity, { passive: true });
    window.addEventListener("touchmove", handleActivity, { passive: true });
    window.addEventListener("ended", handleVideoEnded, true);
    window.addEventListener("resume-creep", handleResumeCreep);
    window.addEventListener("pause-creep", handlePauseCreep);

    // Start timer on mount
    resetIdleTimer();

    return () => {
      stopCreep();
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("wheel", handleActivity);
      window.removeEventListener("touchmove", handleActivity);
      window.removeEventListener("ended", handleVideoEnded, true);
      window.removeEventListener("resume-creep", handleResumeCreep);
      window.removeEventListener("pause-creep", handlePauseCreep);
    };
  }, []);

  return (
    <div className="relative bg-lp-bg font-body">
      <BrandingBar scrollYProgress={scrollYProgress} />
      {/* Hide standard cursor only on non-touch devices where custom cursor is active */}
      {showCursor && (
        <style>{`
          body, button, a, [role="button"], input, select, textarea {
            cursor: none !important;
          }
        `}</style>
      )}

      {/* Global Glowing Custom Cursor */}
      {showCursor && (
        <motion.div
          style={{
            x: cursorX,
            y: cursorY,
          }}
          className="fixed top-0 left-0 w-5 h-5 rounded-full bg-lp-gold/30 border border-lp-gold/50 shadow-[0_0_15px_rgba(207,184,124,0.5)] pointer-events-none z-[9999]"
        />
      )}

      {/* Scroll Cue on First Load */}
      <AnimatePresence>
        {!hideScrollCue && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 pointer-events-none"
          >
            <span className="text-[10px] tracking-[0.2em] text-lp-grey uppercase font-medium">
              Scroll to explore
            </span>
            <motion.svg
              animate={prefersReducedMotion ? {} : { y: [0, 5, 0] }}
              transition={prefersReducedMotion ? {} : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-lp-gold"
            >
              <polyline points="6 9 12 15 18 9" />
            </motion.svg>
          </motion.div>
        )}
      </AnimatePresence>

      <ScrollProgress sectionCount={SECTIONS.length} />
      <NorthDock />

      {/* Auto-scroll Play/Pause Toggle Button */}
      <button
        onClick={handleToggleAutoScroll}
        className="fixed top-6 right-6 z-[9990] w-12 h-12 rounded-full border border-lp-border bg-lp-bg/60 backdrop-blur-md text-lp-smoke flex items-center justify-center cursor-pointer transition-all duration-300 hover:border-lp-gold/60 hover:text-lp-gold hover:drop-shadow-[0_0_12px_rgba(207,184,124,0.4)] group"
        aria-label={isCreepPausedUser ? "Play Auto-scroll" : "Pause Auto-scroll"}
      >
        {isCreepPausedUser ? (
          <svg className="w-5 h-5 ml-0.5 text-lp-gold" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-lp-smoke group-hover:text-lp-gold transition-colors" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        )}
        
        {/* Tooltip */}
        <span className="absolute right-14 scale-0 group-hover:scale-100 transition-all duration-200 bg-lp-card border border-lp-border text-lp-smoke text-[10px] uppercase font-bold tracking-wider px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none select-none">
          {isCreepPausedUser ? "Resume Auto-scroll" : "Pause Auto-scroll"}
        </span>
      </button>

       <GoogleAuthProvider>
        <main>
          {SECTIONS.map((section) => (
            <SectionRouter
              key={section.id}
              data={section}
              sharedMlsData={sharedMlsData}
              setSharedMlsData={setSharedMlsData}
            />
          ))}
        </main>
      </GoogleAuthProvider>

      {debugGaps && <GapDebugOverlay />}
    </div>
  );
}

interface ChildInfo {
  name: string;
  pageTop: number;
  pageLeft: number;
  width: number;
  height: number;
}

interface GapInfo {
  id: string;
  index: number;
  pageTop: number;
  height: number;
  width: number;
  gapToNext: number | null;
  children: ChildInfo[];
}

function GapDebugOverlay() {
  const [gaps, setGaps] = useState<GapInfo[]>([]);

  useEffect(() => {
    const updateGaps = () => {
      const newGaps: GapInfo[] = [];
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      for (let i = 0; i < SECTIONS.length; i++) {
        const id = SECTIONS[i].id;
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const pageTop = rect.top + scrollY;
          const height = el.offsetHeight || rect.height;
          const width = el.offsetWidth || rect.width;
          let gapToNext: number | null = null;
          
          if (i < SECTIONS.length - 1) {
            const nextId = SECTIONS[i + 1].id;
            const nextEl = document.getElementById(nextId);
            if (nextEl) {
              const nextRect = nextEl.getBoundingClientRect();
              const nextPageTop = nextRect.top + scrollY;
              gapToNext = Math.round(nextPageTop - (pageTop + height));
            }
          }

          // Scan visible layout children to identify nested divs
          const children: ChildInfo[] = [];
          const childElements: HTMLElement[] = [];
          
          Array.from(el.children).forEach((c) => {
            childElements.push(c as HTMLElement);
            Array.from(c.children).forEach((innerC) => {
              childElements.push(innerC as HTMLElement);
              Array.from(innerC.children).forEach((deepC) => {
                childElements.push(deepC as HTMLElement);
              });
            });
          });

          childElements.forEach((childEl) => {
            if (childEl.offsetHeight > 4 && childEl.offsetWidth > 4) {
              const childRect = childEl.getBoundingClientRect();
              const childPageTop = Math.round(childRect.top + scrollY);
              const childPageLeft = Math.round(childRect.left + scrollX);
              const cWidth = Math.round(childRect.width);
              const cHeight = Math.round(childRect.height);

              // Skip tracking full container dimensions as children
              if (cWidth === width && cHeight === height) return;

              let name = childEl.getAttribute("data-debug-name") || "";
              if (!name) {
                if (childEl.id) {
                  name = `#${childEl.id}`;
                } else {
                  name = childEl.tagName.toLowerCase();
                  if (childEl.className) {
                    const classes = childEl.className.split(" ").filter(c => c && !c.includes("motion") && !c.includes("style") && !c.includes("transition"));
                    if (classes.length > 0) {
                      name = classes[0];
                    }
                  }
                }
              }

              // De-duplicate indicators
              const exists = children.some(
                (c) =>
                  Math.abs(c.pageTop - childPageTop) < 2 &&
                  Math.abs(c.pageLeft - childPageLeft) < 2 &&
                  Math.abs(c.width - cWidth) < 2 &&
                  Math.abs(c.height - cHeight) < 2
              );

              if (!exists) {
                children.push({
                  name,
                  pageTop: childPageTop,
                  pageLeft: childPageLeft,
                  width: cWidth,
                  height: cHeight,
                });
              }
            }
          });

          newGaps.push({
            id,
            index: i + 1,
            pageTop: Math.round(pageTop),
            height: Math.round(height),
            width: Math.round(width),
            gapToNext,
            children,
          });
        }
      }
      setGaps(newGaps);
    };

    updateGaps();
    window.addEventListener("resize", updateGaps);
    window.addEventListener("scroll", updateGaps);
    const interval = setInterval(updateGaps, 1000);

    return () => {
      window.removeEventListener("resize", updateGaps);
      window.removeEventListener("scroll", updateGaps);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-[9999]">
      {gaps.map((g) => (
        <div key={g.id}>
          {/* Section Number Badge */}
          <div
            className="absolute left-6 font-mono font-bold text-xs pointer-events-auto"
            style={{ top: `${g.pageTop + 12}px` }}
          >
            <span className="bg-lp-gold text-lp-bg px-2.5 py-1 rounded shadow-lg border border-lp-border flex items-center gap-1.5">
              <span>Section {g.index}: <span className="underline">{g.id}</span> ({g.width}x{g.height}px)</span>
            </span>
          </div>

          {/* Gap Badge */}
          {g.gapToNext !== null && (
            <div
              className="absolute left-6 font-mono font-bold text-xs pointer-events-auto"
              style={{ top: `${g.pageTop + g.height}px`, transform: "translateY(-50%)" }}
            >
              <span className="bg-red-600/95 text-white px-2 py-0.5 rounded shadow-lg border border-red-500 flex items-center">
                Gap to next: {g.gapToNext}px
              </span>
            </div>
          )}

          {/* Inner children boxes */}
          {g.children.map((child, cIdx) => (
            <div
              key={cIdx}
              className="absolute border border-dashed border-cyan-500/40 bg-cyan-500/5 pointer-events-none"
              style={{
                top: `${child.pageTop}px`,
                left: `${child.pageLeft}px`,
                width: `${child.width}px`,
                height: `${child.height}px`,
              }}
            >
              <span className="absolute top-1 left-1 bg-cyan-950/90 text-cyan-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-cyan-500/30 whitespace-nowrap pointer-events-auto shadow-md">
                {child.name} ({child.width}x{child.height}px)
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
