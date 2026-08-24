import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { SectionShell } from "@/components/SectionShell";
import { EditorialHeader } from "@/components/EditorialHeader";
import { Reveal } from "@/components/Reveal";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import type { SectionData } from "@/data/content";

export function GoogleCaptureSection({ data }: { data: SectionData }) {
  const { user, setUser } = useGoogleAuth();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    // If user is already logged in, no need to load/render button
    if (user) return;

    const initializeGoogleButton = () => {
      const google = (window as any).google;
      if (!google || !google.accounts || !google.accounts.id) {
        console.warn("Google Identity Services script not ready.");
        return;
      }

      if (!clientId) {
        console.warn("VITE_GOOGLE_CLIENT_ID is not configured in environment.");
        return;
      }

      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          try {
            const decoded: any = jwtDecode(response.credential);
            if (decoded && decoded.email) {
              setUser({
                name: decoded.name || decoded.given_name || "Agent",
                email: decoded.email,
              });
            }
          } catch (err) {
            console.error("Failed to decode Google credential JWT:", err);
          }
        },
      });

      const buttonDiv = document.getElementById("google-signin-btn");
      if (buttonDiv) {
        google.accounts.id.renderButton(buttonDiv, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
        });
      }
    };

    const google = (window as any).google;
    if (google && google.accounts && google.accounts.id) {
      initializeGoogleButton();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleButton;
      document.body.appendChild(script);

      return () => {
        // cleanup script element if component unmounts before loading
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, [user, clientId, setUser]);

  return (
    <SectionShell id={data.id}>
      <EditorialHeader
        align="center"
        eyebrow={data.eyebrow}
        title={data.title}
        body={"body" in data ? data.body : undefined}
      />
      <Reveal delay={0.2}>
        <div className="mt-8 flex flex-col items-center gap-4">
          {!user ? (
            <div id="google-signin-btn" className="min-h-[44px]" />
          ) : (
            <p className="text-lp-gold text-sm font-medium">
              Got it, {user.name} — we'll save your spot.
            </p>
          )}
          <button className="text-lp-grey text-xs underline underline-offset-2 hover:text-lp-smoke transition-colors">
            Skip for now
          </button>
        </div>
      </Reveal>
    </SectionShell>
  );
}
