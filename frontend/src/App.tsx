import { useState, useEffect, useRef } from "react";
import { useMotionValue, useSpring, motion, useScroll, AnimatePresence } from "framer-motion";
import { useLenis } from "@/lib/useLenis";
import { SECTIONS } from "@/data/content";
import { SectionRouter } from "@/sections/SectionRouter";
import { NorthDock } from "@/components/NorthDock/NorthDock";
import { ScrollProgress } from "@/components/ScrollProgress";
import { GoogleAuthProvider } from "@/context/GoogleAuthContext";

export default function App() {
  useLenis();
  const [sharedMlsData, setSharedMlsData] = useState<any | null>(null);
  const [showCursor, setShowCursor] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hideScrollCue, setHideScrollCue] = useState(false);
  const [lenisInstance, setLenisInstance] = useState<any | null>(null);
  const lenisRef = useRef<any>(null);
  const prefersReducedMotionRef = useRef(false);
  const isUserInExclusionZoneRef = useRef<() => boolean>(() => false);

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
          if (isSnapping) return;

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

          if (minDiff > 2 && minDiff < threshold) {
            isSnapping = true;
            lenisInstance.scrollTo(closest, {
              duration: 0.7,
              easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
              onComplete: () => {
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
      // 1. Check if chat panel is open
      const isChatOpen = !!document.querySelector('[aria-label="Chat with North"]');
      if (isChatOpen) return true;

      // 2. Check if any input or interactive element is focused inside these sections
      const active = document.activeElement;
      if (
        active &&
        active.closest("#revenue-calculator, #platform-demo, #ai-marketing, #form, #close")
      ) {
        return true;
      }

      // 3. Check if any exclusion section is visible in the viewport
      const exclusionIds = ["revenue-calculator", "platform-demo", "ai-marketing", "form", "close"];
      for (const id of exclusionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const vh = window.innerHeight;
          // Visible if overlapping with the viewport
          const isVisible = rect.top < vh - 20 && rect.bottom > 20;
          if (isVisible) {
            return true;
          }
        }
      }

      return false;
    };

    isUserInExclusionZoneRef.current = isUserInExclusionZone;

    const creepScroll = () => {
      if (!isCreepActiveRef.current) return;

      const lenis = lenisRef.current;
      const prefersReduced = prefersReducedMotionRef.current;

      if (lenis && !prefersReduced && !isUserInExclusionZone()) {
        const currentScroll = lenis.scroll;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

        if (currentScroll < maxScroll - 5) {
          // Creep forward gently by 1px per frame (approx 60px/sec at 60fps)
          lenis.scrollTo(currentScroll + 1.0, { immediate: true });
        }
      }

      creepFrameId = requestAnimationFrame(creepScroll);
    };

    const startCreep = () => {
      if (isCreepActiveRef.current) return;
      isCreepActiveRef.current = true;
      console.log("[AUTO-SCROLL] Idle creep activated after 3 seconds");
      creepScroll();
    };

    const stopCreep = () => {
      if (isCreepActiveRef.current) {
        isCreepActiveRef.current = false;
        if (creepFrameId !== null) {
          cancelAnimationFrame(creepFrameId);
          creepFrameId = null;
        }
        console.log("[AUTO-SCROLL] Idle creep deactivated due to user interaction");
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
      console.log("[AUTO-SCROLL] Timer registered for 3 seconds of idle time");
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

    // Listen to standard interaction events
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("wheel", handleActivity, { passive: true });
    window.addEventListener("touchmove", handleActivity, { passive: true });

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
    };
  }, []);

  return (
    <div className="relative bg-lp-bg font-body">
      {/* TEST SCROLL — DEBUG BUTTON */}
      <button
        onClick={() => {
          const lenis = lenisRef.current;
          const isExcl = isUserInExclusionZoneRef.current();
          console.log("[DEBUG-CLICK] live state:", {
            lenisInstancePresent: !!lenis,
            currentScrollValue: lenis ? lenis.scroll : null,
            prefersReducedMotion: prefersReducedMotionRef.current,
            isUserInExclusionZone: isExcl
          });
          if (lenis) {
            lenis.scrollTo(lenis.scroll + 5, { immediate: true });
          }
        }}
        className="fixed top-4 left-4 z-[99999] px-3 py-2 bg-lp-gold text-lp-bg font-semibold text-xs rounded shadow-lg hover:bg-lp-gold/90 transition-colors cursor-pointer select-none"
      >
        TEST SCROLL — DEBUG
      </button>

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
    </div>
  );
}
