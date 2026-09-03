import { Fragment } from "react";
import { Circle, Polygon } from "react-leaflet";
import { useMapStore } from "../../store/useMapStore";

const SLICK_COLOR = "#f97316";

function getCenter(positions) {
  const totals = positions.reduce(
    (result, [lat, lng]) => ({
      lat: result.lat + lat,
      lng: result.lng + lng,
    }),
    { lat: 0, lng: 0 },
  );

  return [
    totals.lat / positions.length,
    totals.lng / positions.length,
  ];
}

export function SlickLayer({ slicks = [] }) {
  const selectedSlickId = useMapStore(
    (state) => state.selectedSlickId,
  );

  const hoveredSlickId = useMapStore(
    (state) => state.hoveredSlickId,
  );

  const setSelectedSlickId = useMapStore(
    (state) => state.setSelectedSlickId,
  );

  const setHoveredSlickId = useMapStore(
    (state) => state.setHoveredSlickId,
  );

  if (!Array.isArray(slicks)) {
    return null;
  }

  return (
    <>
      {slicks.map((slick) => {
        const coordinates = slick?.polygon?.coordinates?.[0];

        if (
          !Array.isArray(coordinates) ||
          coordinates.length < 3
        ) {
          return null;
        }

        const positions = coordinates
          .filter((point) => Array.isArray(point) && point.length >= 2)
          .map(([lng, lat]) => [Number(lat), Number(lng)])
          .filter(
            ([lat, lng]) =>
              Number.isFinite(lat) &&
              Number.isFinite(lng),
          );

        if (positions.length < 3) {
          return null;
        }

        const isSelected =
          slick.id === selectedSlickId;

        const isHovered =
          slick.id === hoveredSlickId;

        const detectionConfidence = Number(
          slick.detection_confidence ?? 0,
        );

        const center = getCenter(positions);
        const fillOpacity = isSelected
          ? 0.85
          : isHovered
            ? 0.65
            : 0.35 + Math.max(0, Math.min(1, detectionConfidence)) * 0.3;
        const eventHandlers = {
          click: () => setSelectedSlickId(isSelected ? null : slick.id),
          mouseover: () => setHoveredSlickId(slick.id),
          mouseout: () => setHoveredSlickId(null),
        };

        return (
          <Fragment key={slick.id}>
            {isSelected && (
              <Circle
                center={center}
                radius={3500}
                pathOptions={{
                  color: SLICK_COLOR,
                  fillColor: SLICK_COLOR,
                  fillOpacity: 0.08,
                  weight: 2,
                  opacity: 0.55,
                  dashArray: "5 6",
                }}
              />
            )}
            <Polygon
              positions={positions}
              pathOptions={{
                color: isSelected ? "#ffffff" : isHovered ? "#fdba74" : SLICK_COLOR,
                fillColor: SLICK_COLOR,
                fillOpacity,
                weight: isSelected ? 4 : isHovered ? 3 : 2,
                opacity: 1,
              }}
              eventHandlers={eventHandlers}
            />
          </Fragment>
        );
      })}
    </>
  );
}