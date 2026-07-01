import { useLumeoConfigContext } from "../context/LumeoProvider";
import type { LumeoConfig } from "../types";

export function useLumeoConfig(): LumeoConfig {
  return useLumeoConfigContext();
}
