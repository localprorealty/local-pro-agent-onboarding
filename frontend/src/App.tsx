import { useState, useEffect } from "react";
import { useMotionValue, useSpring, motion } from "framer-motion";
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

  return (
    <div className="relative bg-lp-bg font-body">
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
          className="fixed top-0 left-0 w-5 h-5 rounded-full bg-lp-gold/30 border border-lp-gold/50 shadow-[0_0_15px_rgba(207,184,124,0.5)] pointer-events-none z-50"
        />
      )}

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
