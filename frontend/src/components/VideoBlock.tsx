import { useState, useRef, useEffect } from "react";

interface VideoBlockProps {
  src: string;
  gatesScroll?: boolean;
}

export function VideoBlock({ src, gatesScroll = false }: VideoBlockProps) {
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Pre-flight check to see if the video file exists before loading/displaying the player
  useEffect(() => {
    const verifyVideo = async () => {
      try {
        const res = await fetch(src, { method: "HEAD" });
        if (!res.ok) {
          setHasError(true);
        }
      } catch (e) {
        setHasError(true);
      }
    };
    verifyVideo();
  }, [src]);

  // One-time nudge checks on mount
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);

    const checkNudge = () => {
      const watched = localStorage.getItem("hasWatchedAnyLPVideo");
      setShowNudge(!watched);
    };

    checkNudge();
    window.addEventListener("lp-video-played", checkNudge);

    return () => {
      mediaQuery.removeEventListener("change", handler);
      window.removeEventListener("lp-video-played", checkNudge);
    };
  }, []);

  if (hasError) {
    return null; // Render absolutely nothing, fallback seamlessly to just text
  }

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          localStorage.setItem("hasWatchedAnyLPVideo", "true");
          window.dispatchEvent(new CustomEvent("lp-video-played"));
        })
        .catch(() => setHasError(true));
    }
  };

  return (
    <div className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden border border-lp-border bg-lp-card shadow-lg group mt-6">
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; transform: scale(0.96); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>

      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        controls={isPlaying}
        preload="metadata"
        playsInline
        data-gates-scroll={gatesScroll ? "true" : "false"}
        onPlay={() => {
          setIsPlaying(true);
          localStorage.setItem("hasWatchedAnyLPVideo", "true");
          window.dispatchEvent(new CustomEvent("lp-video-played"));
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setHasError(true)}
      />

      <div
        onClick={handlePlayClick}
        className={`absolute inset-0 bg-black/45 flex items-center justify-center cursor-pointer transition-all duration-500 z-10 ${
          isPlaying ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="relative flex items-center justify-center">
          {/* Radial arrows container */}
          {showNudge && !prefersReducedMotion && (
            <div className="absolute w-32 h-32 flex items-center justify-center">
              {[0, 90, 180, 270].map((deg) => (
                <svg
                  key={deg}
                  className="absolute w-4 h-4 text-lp-gold animate-pulse"
                  style={{
                    transform: `rotate(${deg}deg) translateY(-44px)`,
                  }}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M7 10l5 5 5-5H7z" />
                </svg>
              ))}
            </div>
          )}

          {/* Play Button */}
          <div className="w-16 h-16 rounded-full border border-lp-gold/30 flex items-center justify-center text-lp-gold drop-shadow-[0_0_12px_rgba(207,184,124,0.4)] animate-pulse-slow transition-all duration-300 hover:border-lp-gold/60 hover:text-lp-gold hover:drop-shadow-[0_0_20px_rgba(207,184,124,0.6)]">
            <svg
              className="w-6 h-6 ml-0.5 text-lp-gold"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>

          {/* Label */}
          {showNudge && (
            <div className="absolute top-12 whitespace-nowrap bg-lp-bg-raised/95 border border-lp-border text-lp-gold px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-lg">
              Press play
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
