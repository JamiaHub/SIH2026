import { Circle, CircleMarker } from "react-leaflet";
import { useMapStore } from "../../store/useMapStore";

export function DriftLayer() {
  const selectedSlick = useMapStore((state) =>
    state.slicks.find((slick) => slick.id === state.selectedSlickId),
  );

  if (!selectedSlick) return null;

  const renderPoints = (points, color, dashed) =>
    points.map((point) => (
      <Circle
        key={`${point.t_offset_hours}-${point.radius_km}`}
        center={[point.center[1], point.center[0]]}
        radius={point.radius_km * 1000}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: dashed ? 0.04 : 0.08,
          weight: 1,
          opacity: 0.55,
          dashArray: dashed ? "4 5" : undefined,
        }}
      />
    ));

  return (
    <>
      {renderPoints(selectedSlick.drift.hindcast, "#a9c8d1", true)}
      {renderPoints(selectedSlick.drift.forecast, "#72cdbb", false)}
      <CircleMarker
        center={[
          selectedSlick.polygon.coordinates[0][0][1],
          selectedSlick.polygon.coordinates[0][0][0],
        ]}
        radius={4}
        pathOptions={{ color: "#f7f4ea", fillColor: "#efbd62", fillOpacity: 1 }}
      />
    </>
  );
}
