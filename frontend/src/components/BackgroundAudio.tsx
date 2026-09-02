import { useEffect, useRef, useState } from "react";

const AUDIO_SRC = "/ambient.mp3";
const AMBIENT_VOLUME = 0.15;

export function BackgroundAudio() {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isVideoPlayingRef = useRef(false);
  const userExplicitlyMutedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(AUDIO_SRC);
    audio.loop = true;
    audio.volume = AMBIENT_VOLUME;
    audio.preload = "auto";
    audioRef.current = audio;

    audio.addEventListener("playing", () => {
      setIsPlaying(true);
      setIsMuted(false);
    });
    audio.addEventListener("pause", () => setIsPlaying(false));
    audio.addEventListener("ended", () => setIsPlaying(false));
    audio.onerror = () => setIsPlaying(false);

    const tryPlay = () => {
      if (!audioRef.current) return;
      if (userExplicitlyMutedRef.current || isVideoPlayingRef.current || document.hidden) return;

      audioRef.current.volume = AMBIENT_VOLUME;
      const promise = audioRef.current.play();
      if (promise !== undefined) {
        promise
          .then(() => {
            setIsPlaying(true);
            setIsMuted(false);
          })
          .catch(() => {
            setIsPlaying(false);
          });
      }
    };

    const pauseAudio = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    // Attempt autoplay immediately
    tryPlay();

    // Universal interaction triggers (click, scroll, wheel, touch, keydown, autoscroll)
    const handleGesture = () => {
      if (!userExplicitlyMutedRef.current && !isVideoPlayingRef.current && !document.hidden) {
        tryPlay();
      }
    };

    const gestureEvents = [
      "pointerdown",
      "mousedown",
      "touchstart",
      "touchend",
      "click",
      "keydown",
      "wheel",
      "scroll",
      "resume-creep",
      "lp-scroll-activity",
    ];

    gestureEvents.forEach((evt) => {
      window.addEventListener(evt, handleGesture, { capture: true, passive: true });
      document.addEventListener(evt, handleGesture, { capture: true, passive: true });
    });

    // Page Visibility API
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseAudio();
      } else {
        if (!userExplicitlyMutedRef.current && !isVideoPlayingRef.current) {
          tryPlay();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Video Ducking (Capturing mode)
    const handleVideoPlay = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === "VIDEO") {
        const videoEl = target as HTMLVideoElement;
        if (!videoEl.muted) {
          isVideoPlayingRef.current = true;
          pauseAudio();
        }
      }
    };

    const handleVideoPauseOrEnded = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === "VIDEO") {
        const allVideos = Array.from(document.querySelectorAll("video"));
        const anyUnmutedPlaying = allVideos.some(
          (v) => !v.paused && !v.ended && !v.muted && v.readyState > 2
        );
        isVideoPlayingRef.current = anyUnmutedPlaying;
        if (!anyUnmutedPlaying && !userExplicitlyMutedRef.current && !document.hidden) {
          tryPlay();
        }
      }
    };

    window.addEventListener("play", handleVideoPlay, true);
    window.addEventListener("pause", handleVideoPauseOrEnded, true);
    window.addEventListener("ended", handleVideoPauseOrEnded, true);

    return () => {
      gestureEvents.forEach((evt) => {
        window.removeEventListener(evt, handleGesture, { capture: true });
        document.removeEventListener(evt, handleGesture, { capture: true });
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("play", handleVideoPlay, true);
      window.removeEventListener("pause", handleVideoPauseOrEnded, true);
      window.removeEventListener("ended", handleVideoPauseOrEnded, true);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const toggleAudio = (e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (isPlaying && !isMuted) {
      // User explicitly mutes
      userExplicitlyMutedRef.current = true;
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      // User explicitly unmutes / plays
      userExplicitlyMutedRef.current = false;
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.volume = AMBIENT_VOLUME;
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setIsMuted(false);
          })
          .catch(() => {
            setIsPlaying(false);
          });
      }
    }
  };

  const showActive = isPlaying && !isMuted;

  return (
    <button
      onClick={toggleAudio}
      className="w-12 h-12 rounded-full border border-lp-border bg-lp-bg/60 backdrop-blur-md text-lp-smoke flex items-center justify-center cursor-pointer transition-all duration-300 hover:border-lp-gold/60 hover:text-lp-gold hover:drop-shadow-[0_0_12px_rgba(207,184,124,0.4)] group"
      aria-label={showActive ? "Mute ambient audio" : "Play ambient audio"}
      title={showActive ? "Mute background audio" : "Play background audio"}
    >
      {showActive ? (
        /* Speaker Playing / Sound Waves Icon */
        <svg
          className="w-5 h-5 text-lp-gold group-hover:text-lp-gold transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.414 0-.75-.336-.75-.75V9.75c0-.414.336-.75.75-.75h4.49z"
          />
        </svg>
      ) : (
        /* Speaker Muted / Inactive Icon */
        <svg
          className="w-5 h-5 text-lp-grey group-hover:text-lp-gold transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.414 0-.75-.336-.75-.75V9.75c0-.414.336-.75.75-.75h4.49z"
          />
        </svg>
      )}
    </button>
  );
}
