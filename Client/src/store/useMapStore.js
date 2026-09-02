import { create } from "zustand";

const REGION = {
  center: [9.9, 76.2],
  zoom: 9,
  bounds: [
    [9.35, 75.45],
    [10.75, 77.15],
  ],
};

const DEFAULT_FILTERS = {
  dateRange: ["2026-06-01", "2026-08-31"],
  minDetectionConfidence: 0.7,
  minSlickConfidence: 0.8,
  classes: [
    "infrastructure",
    "natural_seep",
    "coincident_vessel",
    "recent_vessel",
    "old_vessel",
    "ambiguous",
  ],
  sourceTypes: ["vessel", "dark_vessel", "infrastructure"],
  reviewStatus: "all",
};

const matchesFilters = (slick, filters) => {
  const dateKey = slick.timestamp.slice(0, 10);
  return (
    (!filters.dateRange?.[0] ||
      !filters.dateRange?.[1] ||
      (dateKey >= filters.dateRange[0] && dateKey <= filters.dateRange[1])) &&
    slick.detection_confidence >= filters.minDetectionConfidence &&
    slick.slick_confidence >= filters.minSlickConfidence &&
    filters.classes.includes(slick.class) &&
    (filters.reviewStatus === "all" ||
      (filters.reviewStatus === "verified" && slick.hitl_reviewed) ||
      (filters.reviewStatus === "unverified" && !slick.hitl_reviewed)) &&
    (slick.sources.length === 0 ||
      slick.sources.some((source) => filters.sourceTypes.includes(source.type)))
  );
};

export const useMapStore = create((set, get) => ({
  region: REGION,
  filters: DEFAULT_FILTERS,
  slicks: [],
  aisTracks: [],
  selectedSlickId: null,
  hoveredSlickId: null,
  cursorPosition: null,
  mapZoom: 9,
  sourceView: "cards",
  driftTimeOffset: 0,
  layerToggles: { slicks: true, ais: true, driftCone: true },
  setSlicks: (slicks) => set({ slicks }),
  setAISTracks: (aisTracks) => set({ aisTracks }),
  setSelectedSlickId: (selectedSlickId) => set({ selectedSlickId }),
  setHoveredSlickId: (hoveredSlickId) => set({ hoveredSlickId }),
  setCursorPosition: (cursorPosition) => set({ cursorPosition }),
  setMapZoom: (mapZoom) => set({ mapZoom }),
  setFilters: (nextFilters) =>
    set((state) => ({ filters: { ...state.filters, ...nextFilters } })),
  setSourceView: (sourceView) => set({ sourceView }),
  setDriftTimeOffset: (driftTimeOffset) => set({ driftTimeOffset }),
  setLayerToggle: (key, value) =>
    set((state) => ({
      layerToggles: { ...state.layerToggles, [key]: value },
    })),
  getFilteredSlicks: () => {
    const { slicks, filters } = get();
    return slicks.filter((slick) => matchesFilters(slick, filters));
  },
}));
