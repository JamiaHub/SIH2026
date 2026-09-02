import { useMapStore } from "../../store/useMapStore";
import { DateRangeFilter } from "./DateRangeFilter";

export function FilterBar() {
  const filters = useMapStore((state) => state.filters);
  const setFilters = useMapStore((state) => state.setFilters);

  return (
    <div className="w-full bg-transparent text-slate-700">
      <h2 className="mb-4 text-[12px] font-bold uppercase tracking-[0.2em] text-slate-600">
        Slick Filters
      </h2>

      <DateRangeFilter
        value={filters.dateRange}
        onChange={(nextRange) => setFilters({ dateRange: nextRange })}
      />

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-[15px] font-medium text-slate-700">
          <span>Detection confidence</span>
          <span className="text-sm text-slate-500">
            {filters.minDetectionConfidence.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="50"
          max="100"
          step="1"
          value={Math.round(filters.minDetectionConfidence * 100)}
          onChange={(event) =>
            setFilters({
              minDetectionConfidence: Number(event.target.value) / 100,
            })
          }
          className="slider-track h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-300"
        />
        <div className="mt-2 flex justify-between text-[12px] text-slate-500">
          <span>0.50</span>
          <span>0.60</span>
          <span>0.70</span>
          <span>0.80</span>
          <span>0.90</span>
          <span>1.00</span>
        </div>
      </div>

      <div className="mb-6 border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-[12px] font-bold uppercase tracking-[0.2em] text-slate-600">
          Source Filters
        </h3>

        <div className="mb-3 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 shadow-sm">
          <input
            type="text"
            placeholder="Search for Source by ID, Name, Flag or Tag"
            className="w-full border-0 bg-transparent text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none"
          />
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="5.5" />
            <path d="M16 16L21 21" />
          </svg>
        </div>

        <div className="space-y-3 text-[15px] text-slate-700">
          {[
            ["vessel", "Vessel identified nearby"],
            ["dark_vessel", "Dark vessels only"],
            ["infrastructure", "Infrastructure identified nearby"],
          ].map(([type, label]) => (
            <label key={label} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={filters.sourceTypes.includes(type)}
                onChange={() =>
                  setFilters({
                    sourceTypes: filters.sourceTypes.includes(type)
                      ? filters.sourceTypes.filter((item) => item !== type)
                      : [...filters.sourceTypes, type],
                  })
                }
                className="h-4 w-4 rounded border-slate-400 accent-slate-800"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-3 border-t border-slate-200 pt-5">
        <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.2em] text-slate-600">
          Areas of Interest
        </h3>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.2em] text-slate-600">
          Advanced Filters
        </h3>
      </div>
    </div>
  );
}
