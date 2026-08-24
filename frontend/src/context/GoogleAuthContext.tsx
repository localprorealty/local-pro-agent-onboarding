import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export interface GoogleUser {
  name: string;
  email: string;
}

interface GoogleAuthContextType {
  user: GoogleUser | null;
  setUser: (user: GoogleUser | null) => void;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);

  return (
    <GoogleAuthContext.Provider value={{ user, setUser }}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth() {
  const context = useContext(GoogleAuthContext);
  if (!context) {
    throw new Error("useGoogleAuth must be used within a GoogleAuthProvider");
  }
  return context;
}
