import { Polyline, Tooltip } from "react-leaflet";
import { useMapStore } from "../../store/useMapStore";

export function AISLayer() {
  const tracks = useMapStore((state) => state.aisTracks);
  const selectedSlick = useMapStore((state) =>
    state.slicks.find((slick) => slick.id === state.selectedSlickId),
  );
  const highlightedIds = new Set(
    (selectedSlick?.sources ?? [])
      .filter((source) => source.type !== "infrastructure")
      .map((source) => source.id),
  );

  return tracks.map((track) => {
    const highlighted = highlightedIds.has(track.related_source_id);
    return (
      <Polyline
        key={track.vessel_id}
        positions={track.positions.map(([lng, lat]) => [lat, lng])}
        pathOptions={{
          color: highlighted ? "#2563eb" : "#60a5fa",
          weight: highlighted ? 3 : 1,
          opacity: highlighted ? 0.95 : 0.28,
          dashArray: highlighted ? undefined : "3 7",
        }}
      >
        <Tooltip sticky>
          {track.vessel_id} - {track.speed} kn
        </Tooltip>
      </Polyline>
    );
  });
}
