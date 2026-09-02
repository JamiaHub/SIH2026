/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { useShallow } from "zustand/react/shallow";
import { useMapStore } from "../../store/useMapStore";
import { AISLayer } from "./AISLayer";
import { DriftLayer } from "./DriftLayer";
import { SlickLayer } from "./SlickLayer";

const BASE_LAYERS = {
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri, Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  },
};

const INDIA_VIEW_BOUNDS = [
  [6, 67],
  [36, 98],
];

function RegionViewport({ bounds }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds, {
      padding: [24, 24],
      maxZoom: 8,
      animate: false,
    });
  }, [bounds, map]);

  return null;
}

function CursorPositionTracker() {
  const map = useMap();
  const setCursorPosition = useMapStore((state) => state.setCursorPosition);
  const setMapZoom = useMapStore((state) => state.setMapZoom);

  useEffect(() => {
    const handleMouseMove = ({ latlng }) => {
      setCursorPosition({ latitude: latlng.lat, longitude: latlng.lng });
    };
    const handleMouseOut = () => setCursorPosition(null);
    const handleZoomEnd = () => setMapZoom(map.getZoom());

    map.on("mousemove", handleMouseMove);
    map.on("mouseout", handleMouseOut);
    map.on("zoomend", handleZoomEnd);
    handleZoomEnd();

    return () => {
      map.off("mousemove", handleMouseMove);
      map.off("mouseout", handleMouseOut);
      map.off("zoomend", handleZoomEnd);
    };
  }, [map, setCursorPosition, setMapZoom]);

  return null;
}

function MapToolbar({ activeBase, setActiveBase }) {
  const map = useMap();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState(null);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    const mapElement = map.getContainer();

    try {
      if (!document.fullscreenElement) {
        if (mapElement.requestFullscreen) {
          await mapElement.requestFullscreen();
        }
        return;
      }

      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen toggle failed:", error);
    }
  };

  const findMyLocation = () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextLocation = [coords.latitude, coords.longitude];
        setUserLocation(nextLocation);
        map.flyTo([coords.latitude, coords.longitude], 12, {
          duration: 1.5,
        });
      },
      (error) => {
        console.error("Geolocation failed:", error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const searchLocationOnMap = async (event) => {
    event.preventDefault();
    const query = searchQuery.trim();

    if (!query) return;

    const coordinateParts = query.split(",").map((part) => Number(part.trim()));
    const isCoordinateSearch =
      coordinateParts.length === 2 && coordinateParts.every(Number.isFinite);

    if (isCoordinateSearch) {
      const [latitude, longitude] = coordinateParts;
      if (
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        setSearchError("Coordinates are outside the valid range.");
        return;
      }

      const nextLocation = [latitude, longitude];
      setSearchLocation(nextLocation);
      setSearchError("");
      map.flyTo(nextLocation, 10, { duration: 1.5 });
      return;
    }

    try {
      setSearchError("");
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw new Error("Search request failed");

      const results = await response.json();
      if (!results.length) {
        setSearchError("Location not found.");
        return;
      }

      const nextLocation = [Number(results[0].lat), Number(results[0].lon)];
      setSearchLocation(nextLocation);
      map.flyTo(nextLocation, 10, { duration: 1.5 });
    } catch (error) {
      console.error("Location search failed:", error);
      setSearchError("Search is unavailable right now.");
    }
  };

  const resetToIndia = () => {
    setUserLocation(null);
    setSearchLocation(null);
    setSearchQuery("");
    setSearchError("");
    map.fitBounds(INDIA_VIEW_BOUNDS, {
      padding: [24, 24],
      maxZoom: 8,
      animate: true,
    });
  };

  return (
    <>
      <div className="absolute right-4 top-4 z-[500] flex items-start gap-3">
        <form
          onSubmit={searchLocationOnMap}
          className="relative flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 shadow-sm"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="5.5" />
            <path d="M16 16L21 21" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setSearchError("");
            }}
            placeholder="Search place or lat, lon"
            className="w-[300px] border-0 bg-transparent text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none"
          />
          {searchError && (
            <span className="absolute right-0 top-12 whitespace-nowrap rounded-md border border-[#dfb3a8] bg-[#fff1ed] px-2 py-1 text-[11px] text-[#9b4e3d] shadow-sm">
              {searchError}
            </span>
          )}
        </form>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
            aria-label="Toggle map layer"
            title="Toggle map layer"
            onClick={() =>
              setActiveBase((current) =>
                current === "osm" ? "satellite" : "osm",
              )
            }
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 6.5 12 3l9 3.5-9 3.5L3 6.5Z" />
              <path d="M3 11.5 12 15l9-3.5" />
              <path d="M3 16.5 12 20l9-3.5" />
            </svg>
          </button>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            onClick={toggleFullscreen}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5" />
            </svg>
          </button>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
            aria-label="Find my location"
            title="Find my location"
            onClick={findMyLocation}
          >
            <svg
              viewBox="0 0 48 48"
              className="h-5 w-5"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="24" cy="24" r="14" />
              <circle cx="24" cy="24" r="6" fill="#f5f2e9" />
              <circle cx="24" cy="24" r="3.5" />
              <rect x="22" y="2" width="4" height="10" rx="2" />
              <rect x="22" y="36" width="4" height="10" rx="2" />
              <rect x="2" y="22" width="10" height="4" rx="2" />
              <rect x="36" y="22" width="10" height="4" rx="2" />
            </svg>
          </button>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
            aria-label="Reset map"
            title="Reset map"
            onClick={resetToIndia}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 7h10a5 5 0 1 1-1 10H8" />
              <path d="m7 4-3 3 3 3" />
            </svg>
          </button>
        </div>
      </div>
      {userLocation && (
        <Marker position={userLocation}>
          <Popup>
            <div className="flex items-center gap-3">
              <span>Your current location</span>
              <button
                type="button"
                onClick={() => setUserLocation(null)}
                className="font-semibold text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
            </div>
          </Popup>
        </Marker>
      )}
      {searchLocation && (
        <Marker position={searchLocation}>
          <Popup>
            <div className="flex items-center gap-3">
              <span>Search result: {searchQuery}</span>
              <button
                type="button"
                onClick={() => setSearchLocation(null)}
                className="font-semibold text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
}

export function MapShell() {
  const region = useMapStore((state) => state.region);
  const filteredSlicks = useMapStore(
    useShallow((state) => state.getFilteredSlicks()),
  );
  const layerToggles = useMapStore((state) => state.layerToggles);
  const [activeBase, setActiveBase] = useState("osm");

  useEffect(() => {
    setActiveBase("osm");
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f3f3f1]">
      <MapContainer
        center={region.center}
        zoom={region.zoom}
        maxZoom={10}
        minZoom={4}
        scrollWheelZoom
        className="h-full w-full"
      >
        <RegionViewport bounds={INDIA_VIEW_BOUNDS} />
        <CursorPositionTracker />
        <TileLayer
          attribution={BASE_LAYERS[activeBase].attribution}
          url={BASE_LAYERS[activeBase].url}
          opacity={1}
        />
        {layerToggles.driftCone && <DriftLayer />}
        {layerToggles.ais && <AISLayer />}
        {layerToggles.slicks && <SlickLayer slicks={filteredSlicks} />}
        <MapToolbar activeBase={activeBase} setActiveBase={setActiveBase} />
      </MapContainer>
    </div>
  );
}
