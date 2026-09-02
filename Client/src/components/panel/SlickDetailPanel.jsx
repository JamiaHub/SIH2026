import { DarkVesselBadge } from "./DarkVesselBadge";
import { SourceCard } from "./SourceCard";
import { VerifiedBadge } from "./VerifiedBadge";
import { useMapStore } from "../../store/useMapStore";

export function SlickDetailPanel({ slick }) {
  const sourceView = useMapStore((state) => state.sourceView);
  const setSourceView = useMapStore((state) => state.setSourceView);
  const setSelectedSlickId = useMapStore((state) => state.setSelectedSlickId);

  if (!slick) {
    return (
      <aside className="rounded-lg border border-[#c8d2cd] bg-[#f5f2e9]/95 p-5 text-[#637477] shadow-[0_12px_28px_rgba(35,54,55,0.16)] backdrop-blur-sm">
        No slick selected.
      </aside>
    );
  }

  return (
    <aside className="rounded-none border border-[#c8d2cd] bg-[#f5f2e9]/95 p-5 shadow-[0_12px_28px_rgba(35,54,55,0.16)] backdrop-blur-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#718083]">
            Inspection
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[#253642]">
            {slick.id}
          </h2>
        </div>
        <div className="flex flex-wrap items-start justify-end gap-2">
          <div className="flex flex-wrap justify-end gap-2 ">
            <DarkVesselBadge slick={slick} />
            <VerifiedBadge reviewed={slick.hitl_reviewed} />
          </div>
          <button
            type="button"
            onClick={() => setSelectedSlickId(null)}
            className="grid h-8 w-8 place-items-center text-lg leading-none text-[#53696d] transition hover:bg-[#ebe9e0] hover:text-[#246d68] rounded-full"
            aria-label="Close slick details"
            title="Close slick details"
          >
            <span aria-hidden="true">x</span>
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 text-sm text-[#53696d]">
        <div className="rounded-lg border border-[#d1d9d3] bg-[#ebe9e0] p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[#718083]">
            Class
          </p>
          <p className="mt-2 capitalize text-[#253642]">
            {slick.class.replace("_", " ")}
          </p>
        </div>
        <div className="rounded-lg border border-[#d1d9d3] bg-[#ebe9e0] p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[#718083]">
            Area
          </p>
          <p className="mt-2 text-[#253642]">{slick.area.toFixed(1)} km2</p>
        </div>
        <div className="rounded-lg border border-[#d1d9d3] bg-[#ebe9e0] p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[#718083]">
            Detection
          </p>
          <p className="mt-2 text-[#253642]">
            {slick.detection_confidence.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-[#d1d9d3] bg-[#ebe9e0] p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[#718083]">
            Slick score
          </p>
          <p className="mt-2 text-[#253642]">
            {slick.slick_confidence.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-[#d1d9d3] bg-[#ebe9e0] p-3">
        <p className="text-xs uppercase tracking-[0.16em] text-[#718083]">
          Observations
        </p>
        <p className="mt-2 text-sm text-[#53696d]">
          Age estimate:{" "}
          <span className="font-medium text-[#253642]">
            {slick.age_estimate} hours
          </span>
        </p>
        <p className="mt-1 text-sm text-[#53696d]">
          Acquisition:{" "}
          <span className="font-medium text-[#253642]">
            {new Date(slick.timestamp).toLocaleString()}
          </span>
        </p>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#53696d]">
            Candidate sources
          </h3>
          <div className="flex rounded-md border border-[#c8d2cd] bg-[#e7e8df] p-0.5 text-[10px] font-bold uppercase tracking-[0.12em]">
            {["cards", "table"].map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setSourceView(view)}
                className={`rounded px-2 py-1 ${sourceView === view ? "bg-[#f8f6ef] text-[#246d68] shadow-sm" : "text-[#718083]"}`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>

        {sourceView === "cards" ? (
          <div className="space-y-3">
            {slick.sources.map((source) => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[#c8d2cd] bg-[#f8f6ef] text-xs">
            <div className="grid grid-cols-[1fr_70px_1fr] border-b border-[#d1d9d3] bg-[#e7e8df] px-3 py-2 font-bold uppercase tracking-[0.1em] text-[#718083]">
              <span>Source</span>
              <span>Score</span>
              <span>Why</span>
            </div>
            {slick.sources.map((source) => (
              <div
                key={source.id}
                className="grid grid-cols-[1fr_70px_1fr] items-center border-b border-[#e4e6df] px-3 py-3 text-[#53696d] last:border-0"
              >
                <span className="font-semibold text-[#253642]">
                  {source.id}
                </span>
                <span className="font-bold text-[#246d68]">
                  {source.fused_score.toFixed(2)}
                </span>
                <span className="capitalize">
                  {source.dominant_factor.replaceAll("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
