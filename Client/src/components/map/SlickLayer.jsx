import { Polygon } from "react-leaflet";
import { useMapStore } from "../../store/useMapStore";

const CLASS_COLORS = {
  infrastructure: "#8aa0d5",
  natural_seep: "#34d399",
  coincident_vessel: "#60a5fa",
  recent_vessel: "#7dd3fc",
  old_vessel: "#fbbf24",
  ambiguous: "#f87171",
};

export function SlickLayer({ slicks }) {
  const selectedSlickId = useMapStore((state) => state.selectedSlickId);
  const hoveredSlickId = useMapStore((state) => state.hoveredSlickId);
  const setSelectedSlickId = useMapStore((state) => state.setSelectedSlickId);
  const setHoveredSlickId = useMapStore((state) => state.setHoveredSlickId);

  return slicks.map((slick) => {
    const fillColor = CLASS_COLORS[slick.class] ?? "#94a3b8";
    const isSelected = slick.id === selectedSlickId;
    const isHovered = slick.id === hoveredSlickId;

    return (
      <Polygon
        key={slick.id}
        positions={slick.polygon.coordinates[0].map(([lng, lat]) => [lat, lng])}
        pathOptions={{
          color: isSelected ? "#f4fffb" : isHovered ? "#70d2c0" : fillColor,
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
