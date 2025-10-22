import React, { useState } from "react";

interface BrandHeaderProps {
  title?: string;
  subtitle?: string;
  logoSrc?: string; // Optional: use specific asset; falls back to PNG/SVG
}

// Resolve public asset URLs with respect to Vite base
const base = import.meta.env.BASE_URL || "/";
const resolvePublic = (p: string) => `${base}${p.replace(/^\//, "")}`;
const normalize = (p?: string) => (p ? resolvePublic(p) : undefined);

export default function BrandHeader({
  title = "PROMPTS geni",
  subtitle = "your Prompt is My Command",
  logoSrc,
}: BrandHeaderProps) {
  const [srcToUse, setSrcToUse] = useState<string>(normalize(logoSrc) ?? resolvePublic("Genie.png"));
  const [fallbackTried, setFallbackTried] = useState<boolean>(false);
  const [logoFailed, setLogoFailed] = useState<boolean>(false);

  return (
    <header className="relative w-full overflow-hidden rounded-xl border-2 border-border dark:border-dark-border shadow-sm bg-panel dark:bg-dark-panel">
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b1221]/40 via-transparent to-[#0b1221]/30" />
      {/* Centered title overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <h1 className="font-brand text-xl md:text-2xl font-semibold text-text-primary dark:text-dark-text-primary">{title}</h1>
      </div>
      <div className="relative flex items-center gap-6 px-4 md:px-6 py-0.5 md:py-1.5">
        <div className="flex items-center gap-3">
          <div className="overflow-hidden rounded-lg border-2 border-border dark:border-dark-border shadow-sm">
            {!logoFailed ? (
              <img
                src={srcToUse}
                alt="Brand logo"
                className="h-10 w-10 md:h-12 md:w-12 object-cover"
                onError={() => {
                  if (!fallbackTried) {
                    setFallbackTried(true);
                    setSrcToUse(resolvePublic("Genie.png"));
                  } else {
                    setLogoFailed(true);
                  }
                }}
              />
            ) : (
              <div className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center bg-dark-background text-dark-text-secondary text-xs">No Logo</div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">{title}</span>
            <span className="text-[11px] text-text-secondary dark:text-dark-text-secondary">{subtitle}</span>
          </div>
        </div>
        {/* Removed SupabaseStatus badges from header */}
      </div>
    </header>
  );
}