import { useState, useRef, useEffect } from "react";

interface VideoBlockProps {
  src: string;
  gatesScroll?: boolean;
}

export function VideoBlock({ src, gatesScroll = false }: VideoBlockProps) {
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
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

  // Synchronize state with video volume/mute properties
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVolumeChange = () => {
      setIsMuted(video.muted);
    };

    video.addEventListener("volumechange", handleVolumeChange);
    setIsMuted(video.muted);

    return () => {
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, []);

  if (hasError) {
    return null; // Render absolutely nothing, fallback seamlessly to just text
  }

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setHasError(true));
    }
  };

  const handleUnmuteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = false;
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
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setHasError(true)}
      />

      {/* Floating Unmute Button */}
      {isPlaying && isMuted && (
        <button
          onClick={handleUnmuteClick}
          className="absolute top-4 right-4 z-30 bg-lp-bg/85 backdrop-blur-sm border border-lp-border px-3.5 py-2 rounded-full flex items-center gap-2 text-xs text-lp-smoke font-body shadow-xl hover:bg-lp-bg hover:scale-105 transition-all duration-300"
        >
          <svg
            className="w-4 h-4 text-lp-gold animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
            />
          </svg>
          <span className="font-semibold tracking-wide">Tap for Sound</span>
        </button>
      )}

      <div
        onClick={handlePlayClick}
        className={`absolute inset-0 bg-black/45 flex items-center justify-center cursor-pointer transition-all duration-500 z-10 ${
          isPlaying ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="w-16 h-16 rounded-full border border-lp-gold/30 flex items-center justify-center text-lp-gold drop-shadow-[0_0_12px_rgba(207,184,124,0.4)] animate-pulse-slow transition-all duration-300 hover:border-lp-gold/60 hover:text-lp-gold hover:drop-shadow-[0_0_20px_rgba(207,184,124,0.6)]">
          <svg
            className="w-6 h-6 ml-0.5 text-lp-gold"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
