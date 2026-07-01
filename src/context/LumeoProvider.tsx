import React, { createContext, useContext, useMemo } from "react";
import type { LumeoConfig } from "../types";

const LumeoConfigContext = createContext<LumeoConfig | null>(null);

export interface LumeoProviderProps {
  config: LumeoConfig;
  children: React.ReactNode;
}

export function LumeoProvider({ config, children }: LumeoProviderProps) {
  const value = useMemo(() => config, [config]);
  return <LumeoConfigContext.Provider value={value}>{children}</LumeoConfigContext.Provider>;
}

export function useLumeoConfigContext(): LumeoConfig {
  const ctx = useContext(LumeoConfigContext);
  if (!ctx) {
    throw new Error("Lumeo components must be rendered inside a <LumeoProvider config={...}>.");
  }
  return ctx;
}
