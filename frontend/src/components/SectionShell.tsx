import type { ReactNode } from "react";

interface SectionShellProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function SectionShell({ id, children, className = "" }: SectionShellProps) {
  return (
    <section
      id={id}
      className={`min-h-screen w-full flex flex-col items-center justify-center px-6 md:px-16 py-24 ${className}`}
    >
      <div className="w-full max-w-5xl mx-auto">{children}</div>
    </section>
  );
}
