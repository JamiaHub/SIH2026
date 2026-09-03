import { useMemo } from "react";

import { useMapStore } from "../../store/useMapStore";

const safeNumber = (
  value,
  fallback = 0,
) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const formatOffset = (
  hours,
) => {
  const value =
    safeNumber(hours);

  if (value === 0) {
    return "0H";
  }

  return `${
    value > 0 ? "+" : "−"
  }${Math.abs(value)}H`;
};

export function DriftTimeSlider({
  slick,
}) {
  const driftTimeOffset =
    useMapStore(
      (state) =>
        state.driftTimeOffset,
    );

  const setDriftTimeOffset =
    useMapStore(
      (state) =>
        state.setDriftTimeOffset,
    );

  const steps = useMemo(() => {
    const hindcast =
      Array.isArray(
        slick?.drift?.hindcast,
      )
        ? slick.drift.hindcast
        : [];

    const forecast =
      Array.isArray(
        slick?.drift?.forecast,
      )
        ? slick.drift.forecast
        : [];

    return [
      ...hindcast.map(
        (point) => ({
          ...point,
          phase: "hindcast",
        }),
      ),

      {
        t_offset_hours: 0,
        phase: "current",
      },

      ...forecast.map(
        (point) => ({
          ...point,
          phase: "forecast",
        }),
      ),
    ]
      .filter(
        (point) =>
          Number.isFinite(
            Number(
              point.t_offset_hours,
            ),
          ),
      )
      .sort(
        (a, b) =>
          Number(
            a.t_offset_hours,
          ) -
          Number(
            b.t_offset_hours,
          ),
      )
      .filter(
        (
          point,
          index,
          list,
        ) =>
          index === 0 ||
          Number(
            point.t_offset_hours,
          ) !==
            Number(
              list[
                index - 1
              ]
                .t_offset_hours,
            ),
      );
  }, [slick]);

  if (!steps.length) {
    return null;
  }

  const currentOffset =
    safeNumber(
      driftTimeOffset,
    );

  const activeIndex =
    steps.findIndex(
      (step) =>
        safeNumber(
          step.t_offset_hours,
        ) === currentOffset,
    );

  const currentIndex =
    steps.findIndex(
      (step) =>
        step.phase ===
        "current",
    );

  const safeIndex =
    activeIndex === -1
      ? Math.max(
          0,
          currentIndex,
        )
      : activeIndex;

  const activeStep =
    steps[safeIndex];

  const phaseLabel =
    activeStep?.phase ===
    "hindcast"
      ? "Hindcast"
      : activeStep?.phase ===
          "forecast"
        ? "Forecast"
        : "Current observation";

  const radius =
    safeNumber(
      activeStep?.radius_km,
    );

  return (
    <div className="rounded-xl border border-[#d5dcd7] bg-white p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#718083]">
            Drift timeline
          </p>

          <p className="mt-1 text-[10px] text-[#879394]">
            Scrub the modeled
            movement envelope.
          </p>
        </div>

        <div className="text-right">
          <p className="text-base font-semibold text-[#246d68]">
            {formatOffset(
              activeStep?.t_offset_hours,
            )}
          </p>

          <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#819091]">
            {phaseLabel}
          </p>
        </div>
      </div>

      <input
        aria-label="Drift timeline"
        type="range"
        min="0"
        max={Math.max(
          0,
          steps.length - 1,
        )}
        step="1"
        value={Math.max(
          0,
          safeIndex,
        )}
        onChange={(event) => {
          const step =
            steps[
              Number(
                event.target.value,
              )
            ];

          setDriftTimeOffset(
            safeNumber(
              step?.t_offset_hours,
            ),
          );
        }}
        className="marineeye-range mt-4 w-full"
      />

      <div className="mt-1 flex justify-between text-[8px] font-medium text-[#819091]">
        <span>
          {formatOffset(
            steps[0]
              ?.t_offset_hours,
          )}
        </span>

        <span>0H</span>

        <span>
          {formatOffset(
            steps[
              steps.length - 1
            ]?.t_offset_hours,
          )}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#e4e8e4] pt-3">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#879394]">
            Phase
          </p>

          <p className="mt-1 text-[10px] font-semibold text-[#344b4e]">
            {phaseLabel}
          </p>
        </div>

        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#879394]">
            Step
          </p>

          <p className="mt-1 text-[10px] font-semibold text-[#344b4e]">
            {safeIndex + 1}/
            {steps.length}
          </p>
        </div>

        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#879394]">
            Radius
          </p>

          <p className="mt-1 text-[10px] font-semibold text-[#344b4e]">
            {radius
              ? `${radius.toFixed(
                  1,
                )} km`
              : "—"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 text-[8px] text-[#718083]">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7f9ca3]" />
          Hindcast
        </span>

        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#efbd62]" />
          Observation
        </span>

        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#45a99a]" />
          Forecast
        </span>
      </div>

      <p className="mt-3 text-[8px] leading-4 text-[#8a9798]">
        Demo drift values are
        deterministic visualization
        fixtures, not scientific
        ocean-current predictions.
      </p>
    </div>
  );
}