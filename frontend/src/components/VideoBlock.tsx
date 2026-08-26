import { useState, useRef, useEffect } from "react";

interface VideoBlockProps {
  src: string;
  gatesScroll?: boolean;
}

export function VideoBlock({ src, gatesScroll = false }: VideoBlockProps) {
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
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

  return (
    <div className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden border border-lp-border bg-lp-card shadow-lg group mt-6">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        controls={isPlaying}
        preload="metadata"
        data-gates-scroll={gatesScroll ? "true" : "false"}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setHasError(true)}
      />

      {!isPlaying && (
        <div
          onClick={handlePlayClick}
          className="absolute inset-0 bg-lp-bg/60 flex items-center justify-center cursor-pointer group-hover:bg-lp-bg/40 transition-colors z-10"
        >
          <div className="w-16 h-16 rounded-full bg-lp-gold/90 text-lp-bg flex items-center justify-center shadow-2xl hover:scale-105 hover:bg-lp-gold transition-all duration-200">
            {/* Play Icon */}
            <svg
              className="w-8 h-8 ml-1 text-lp-bg"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
