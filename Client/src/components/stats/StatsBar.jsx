import { useMapStore } from "../../store/useMapStore";
import { useShallow } from "zustand/react/shallow";

export function StatsBar() {
  const filteredSlicks = useMapStore(
    useShallow((state) => state.getFilteredSlicks()),
  );

  const total = filteredSlicks.length;
  const darkVesselCount = filteredSlicks.filter((slick) =>
    slick.sources.some(
      (source) =>
        source.type === "dark_vessel" || source.type === "infrastructure",
    ),
  ).length;
  const topConfidence = filteredSlicks.length
    ? Math.max(
        ...filteredSlicks.map((slick) => slick.detection_confidence),
      ).toFixed(2)
    : "0.00";

  const stats = [
    { label: "Slicks in view", value: total },
    { label: "Dark-vessel cases", value: darkVesselCount },
    { label: "Peak confidence", value: topConfidence },
  ];

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-md shadow-slate-950/30"
        >
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
            {stat.label}
          </p>
          <p className="mt-3 text-2xl font-semibold text-slate-50">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
