import { Polygon } from "react-leaflet";
import { useMapStore } from "../../store/useMapStore";

const SLICK_COLOR = "#f97316";

export function SlickLayer({ slicks }) {
  const selectedSlickId = useMapStore((state) => state.selectedSlickId);
  const hoveredSlickId = useMapStore((state) => state.hoveredSlickId);
  const setSelectedSlickId = useMapStore((state) => state.setSelectedSlickId);
  const setHoveredSlickId = useMapStore((state) => state.setHoveredSlickId);

  return slicks.map((slick) => {
    const fillColor = SLICK_COLOR;
    const isSelected = slick.id === selectedSlickId;
    const isHovered = slick.id === hoveredSlickId;

    return (
      <Polygon
        key={slick.id}
        positions={slick.polygon.coordinates[0].map(([lng, lat]) => [lat, lng])}
        pathOptions={{
          color: isSelected ? "#fff7ed" : isHovered ? "#fdba74" : fillColor,
          fillColor,
          fillOpacity: isSelected
            ? 0.78
            : 0.35 + slick.detection_confidence * 0.35,
          weight: isSelected ? 3 : isHovered ? 2 : 1.1,
          opacity: 0.95,
        }}
        eventHandlers={{
          click: () => setSelectedSlickId(isSelected ? null : slick.id),
          mouseover: () => setHoveredSlickId(slick.id),
          mouseout: () => setHoveredSlickId(null),
        }}
      />
    );
  });
}
