const SCORE_LABELS = {
  cpa: "CPA",
  tcpa: "TCPA",
  drift_overlap: "Drift overlap",
  ais_gap_anomaly: "AIS gap",
  behavioral_anomaly: "Behavior",
};

export function SourceCard({ source }) {
  const sourceIcon =
    source.type === "dark_vessel"
      ? "DV"
      : source.type === "vessel"
        ? "AIS"
        : "INF";

  return (
    <div className="rounded-lg border border-[#c8d2cd] bg-[#f8f6ef]/90 p-3 shadow-[0_5px_15px_rgba(48,65,62,0.05)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-[#dcebe5] text-[10px] font-bold text-[#246d68]">
            {sourceIcon}
          </span>
          <div>
            <p className="text-sm font-semibold text-[#253642]">{source.id}</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#718083]">
              {source.type.replace("_", " ")}
            </p>
          </div>
        </div>
        <div className="rounded-full border border-[#7fc9b8] bg-[#e3f2ec] px-2 py-1 text-xs font-bold text-[#246d68]">
          {source.fused_score.toFixed(2)} fused
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-[#718083]">
        <span>Dominant factor</span>
        <span className="rounded-full border border-[#9ed4c5] bg-[#e6f3ed] px-2 py-1 font-bold capitalize text-[#246d68]">
          {source.dominant_factor.replace("_", " ")}
        </span>
      </div>

      <div className="space-y-2">
        {Object.entries(source.sub_scores).map(([key, value]) => (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between text-[11px] text-[#53696d]">
              <span>{SCORE_LABELS[key] ?? key}</span>
              <span>{Number(value).toFixed(2)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#d7e1dc]">
              <div
                className="h-1.5 rounded-full bg-[#4bafa0]"
                style={{ width: `${Math.max(8, Number(value) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
