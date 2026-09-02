import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "lp_ambient_muted";
const AUDIO_SRC = "/ambient.mp3";
const AMBIENT_VOLUME = 0.15;

export function BackgroundAudio() {
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isVideoPlayingRef = useRef(false);
  const userInteractedRef = useRef(false);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const audio = new Audio();
    audio.src = AUDIO_SRC;
    audio.loop = true;
    audio.volume = AMBIENT_VOLUME;
    audio.preload = "auto";
    audioRef.current = audio;

    // Graceful missing-file handling (silent fail if /ambient.mp3 is not present)
    audio.onerror = () => {
      // Silent error handler
    };

    const playAudio = () => {
      if (
        !audioRef.current ||
        isMutedRef.current ||
        isVideoPlayingRef.current ||
        document.hidden
      ) {
        return;
      }
      audioRef.current.play().catch(() => {
        // Silently catch autoplay restriction or missing file
      });
    };

    const pauseAudio = () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };

    // Attempt autoplay immediately on mount (if browser MEI permits)
    playAudio();

    // Universal interaction triggers (click, scroll, wheel, touch, keydown, autoscroll)
    const handleInteractionTrigger = () => {
      userInteractedRef.current = true;
      if (!isMutedRef.current && !isVideoPlayingRef.current && !document.hidden) {
        playAudio();
      }
    };

    const interactionEvents = [
      "pointerdown",
      "mousedown",
      "click",
      "touchstart",
      "wheel",
      "scroll",
      "keydown",
      "resume-creep",
      "lp-scroll-activity",
    ];

    interactionEvents.forEach((evt) => {
      window.addEventListener(evt, handleInteractionTrigger, { passive: true });
    });

    // Page Visibility API: pause when tab is backgrounded, resume when active
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseAudio();
      } else {
        if (userInteractedRef.current && !isMutedRef.current && !isVideoPlayingRef.current) {
          playAudio();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Independent Video Ducking Event Listeners (capturing mode)
    const handleVideoPlay = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === "VIDEO") {
        isVideoPlayingRef.current = true;
        pauseAudio();
      }
    };

    const handleVideoPauseOrEnded = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === "VIDEO") {
        const allVideos = Array.from(document.querySelectorAll("video"));
        const anyPlaying = allVideos.some((v) => !v.paused && !v.ended && v.readyState > 2);
        isVideoPlayingRef.current = anyPlaying;
        if (!anyPlaying && userInteractedRef.current && !isMutedRef.current && !document.hidden) {
          playAudio();
        }
      }
    };

    window.addEventListener("play", handleVideoPlay, true);
    window.addEventListener("pause", handleVideoPauseOrEnded, true);
    window.addEventListener("ended", handleVideoPauseOrEnded, true);

    return () => {
      interactionEvents.forEach((evt) => {
        window.removeEventListener(evt, handleInteractionTrigger);
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

  const toggleMute = () => {
    userInteractedRef.current = true;
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "true" : "false");
      } catch {
        // ignore localStorage errors
      }

      if (next) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      } else {
        if (audioRef.current && !isVideoPlayingRef.current && !document.hidden) {
          audioRef.current.play().catch(() => {});
        }
      }
      return next;
    });
  };

  return (
    <button
      onClick={toggleMute}
      className="w-12 h-12 rounded-full border border-lp-border bg-lp-bg/60 backdrop-blur-md text-lp-smoke flex items-center justify-center cursor-pointer transition-all duration-300 hover:border-lp-gold/60 hover:text-lp-gold hover:drop-shadow-[0_0_12px_rgba(207,184,124,0.4)] group"
      aria-label={isMuted ? "Unmute ambient audio" : "Mute ambient audio"}
      title={isMuted ? "Unmute background audio" : "Mute background audio"}
    >
      {isMuted ? (
        /* Speaker Muted Icon */
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
      ) : (
        /* Speaker Playing Icon */
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
      )}
    </button>
  );
}
