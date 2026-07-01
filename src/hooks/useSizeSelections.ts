import { useCallback, useState } from "react";

export interface UseSizeSelectionsResult {
  selectedIds: string[];
  toggle: (id: string) => void;
  isSelected: (id: string) => boolean;
  clear: () => void;
}

/** Tracks which preset output sizes the user picked in the "Boyut Seçenekleri" tab. */
export function useSizeSelections(initial: string[] = []): UseSizeSelectionsResult {
  const [selectedIds, setSelectedIds] = useState<string[]>(initial);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds]);
  const clear = useCallback(() => setSelectedIds([]), []);

  return { selectedIds, toggle, isSelected, clear };
}
