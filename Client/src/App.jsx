import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { getMarineEyeData } from "./api/mockClient";
import { FilterBar } from "./components/filters/FilterBar";
import { MapShell } from "./components/map/MapShell";
import { SlickDetailPanel } from "./components/panel/SlickDetailPanel";
import { useMapStore } from "./store/useMapStore";

export default function App() {
  const [dataError, setDataError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const slicks = useMapStore((state) => state.slicks);
  const visibleSlicks = useMapStore(
    useShallow((state) => state.getFilteredSlicks()),
  );
  const selectedSlickId = useMapStore((state) => state.selectedSlickId);
  const cursorPosition = useMapStore((state) => state.cursorPosition);
  const mapZoom = useMapStore((state) => state.mapZoom);
  const setSlicks = useMapStore((state) => state.setSlicks);
  const setAISTracks = useMapStore((state) => state.setAISTracks);

  useEffect(() => {
    const currentSlicks = useMapStore.getState().slicks;

    if (currentSlicks.length > 0) {
      return;
    }

    getMarineEyeData()
      .then(({ slicks: nextSlicks, aisTracks }) => {
        setSlicks(nextSlicks);
        setAISTracks(aisTracks);
      })
      .catch((error) => setDataError(error.message))
      .finally(() => setIsLoading(false));
  }, [setAISTracks, setSlicks]);

  return (
    <div className="min-h-screen bg-[#e9e5dc] text-[#253642]">
      <header className="border-b border-[#cdd4ce] bg-[#f5f2e9]/95">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-[1.3rem] font-semibold tracking-tight text-slate-900">
              Marine<span className="text-[#258f86]">Eye</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Help
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Account
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex h-[calc(100vh-57px)] max-w-[1800px] overflow-hidden border border-[#cdd4ce] border-t-0 bg-[#eeece5] shadow-[0_14px_40px_rgba(46,59,58,0.08)]">
        <aside
          className={`relative z-[1000] h-full w-[360px] shrink-0 border-r border-[#cdd4ce] bg-[#e5e5dc] shadow-[4px_0_18px_rgba(46,59,58,0.05)] ${
            selectedSlickId ? "overflow-y-auto" : "overflow-y-visible"
          } ${!selectedSlickId ? "p-5" : ""}`}
        >
          {selectedSlickId ? (
            <SlickDetailPanel
              slick={slicks.find((slick) => slick.id === selectedSlickId)}
            />
          ) : (
            <FilterBar />
          )}
        </aside>

        <main className="relative flex-1 bg-[#d7e0dc]">
          <MapShell />
          {isLoading && (
            <div className="absolute left-4 top-4 z-[700] rounded-md border border-[#b8c8c3] bg-[#f5f2e9]/95 px-3 py-2 text-xs text-[#637477] shadow-sm">
              Loading marine observations...
            </div>
          )}
          {dataError && (
            <div className="absolute left-4 top-4 z-[700] max-w-sm rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-sm">
              Could not load observations. Start the FastAPI server on port
              3001.
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[600] flex justify-between border-t border-[#b8c8c3] bg-[#f5f2e9]/90 px-4 py-2 text-[11px] text-[#637477] backdrop-blur-sm">
            <span>{visibleSlicks.length} slicks in view</span>
            <span>
              {cursorPosition
                ? `Lat ${cursorPosition.latitude.toFixed(5)}, Lon ${cursorPosition.longitude.toFixed(5)}`
                : "Move over map for coordinates"}
            </span>
            <span>Altitude: {Math.round(40075 / 2 ** mapZoom)} km</span>
          </div>
        </main>
      </div>
    </div>
  );
}
