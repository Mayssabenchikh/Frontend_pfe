import type { GridApi } from "ag-grid-community";

/** Aligné sur le breakpoint `md` de Tailwind (768px). */
export const AG_GRID_RESPONSIVE_BREAKPOINT_PX = 768;

export function isAgGridNarrowViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < AG_GRID_RESPONSIVE_BREAKPOINT_PX;
}

/**
 * Sous ~768px : largeurs basées sur le contenu + défilement horizontal.
 * Au-delà : colonnes étirées pour remplir la grille.
 */
export function syncAgGridColumnSizing(api: GridApi | null | undefined): void {
  if (!api || api.isDestroyed()) return;
  try {
    if (isAgGridNarrowViewport()) {
      api.autoSizeAllColumns(false);
    } else {
      api.sizeColumnsToFit();
    }
  } catch {
    /* Grille pas encore dimensionnée */
  }
}
