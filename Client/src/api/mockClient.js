const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];
    if (character === '"' && quoted && nextCharacter === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  row.push(value);
  if (row.some((cell) => cell !== "")) rows.push(row);

  const [headers, ...dataRows] = rows;
  return dataRows.map((dataRow) =>
    Object.fromEntries(
      headers.map((header, index) => [header, dataRow[index] ?? ""]),
    ),
  );
};

const asNumber = (value) => Number(value);
const asBoolean = (value) =>
  ["true", "1", "yes"].includes(String(value).toLowerCase());

const polygonFromWkt = (value) => ({
  type: "Polygon",
  coordinates: [
    value
      .replace("POLYGON((", "")
      .replace("))", "")
      .split(",")
      .map((pair) => pair.trim().split(/\s+/).map(Number)),
  ],
});

const buildDriftCone = (centerLat, centerLng) => ({
  hindcast: Array.from({ length: 5 }, (_, index) => ({
    t_offset_hours: -(index + 1) * 8,
    center: [centerLng, centerLat],
    radius_km: Number((index * 1.8 + 1.8).toFixed(2)),
  })),
  forecast: Array.from({ length: 4 }, (_, index) => ({
    t_offset_hours: (index + 1) * 6,
    center: [centerLng, centerLat],
    radius_km: Number((index * 0.8 + 0.8).toFixed(2)),
  })),
});

export const getMarineEyeData = async () => {
  const paths = [
    "/mock_slick_detections.csv",
    "/mock_sources.csv",
    "/mock_ais_tracks.csv",
  ];
  const responses = await Promise.all(paths.map((path) => fetch(path)));
  if (responses.some((response) => !response.ok)) {
    throw new Error("MarineEye mock CSV data could not be loaded");
  }

  const [slickRows, sourceRows, aisRows] = await Promise.all(
    responses.map((response) => response.text().then(parseCsv)),
  );
  const sourcesBySlick = sourceRows.reduce((groups, row) => {
    const source = {
      id: row.source_id,
      type: row.type,
      sub_scores: {
        cpa: asNumber(row.cpa),
        tcpa: asNumber(row.tcpa),
        drift_overlap: asNumber(row.drift_overlap),
        ais_gap_anomaly: asNumber(row.ais_gap_anomaly),
        behavioral_anomaly: asNumber(row.behavioral_anomaly),
      },
      fused_score: asNumber(row.fused_score),
      dominant_factor: row.dominant_factor,
      navic_tracked: asBoolean(row.navic_tracked),
    };
    (groups[row.slick_id] ??= []).push(source);
    return groups;
  }, {});

  const slicks = slickRows.map((row) => ({
    id: row.id,
    polygon: polygonFromWkt(row.polygon_wkt),
    class: row.class,
    detection_confidence: asNumber(row.detection_confidence),
    slick_confidence: asNumber(row.slick_confidence),
    area: asNumber(row.area_km2),
    age_estimate: asNumber(row.age_estimate_hours),
    timestamp: row.timestamp,
    hitl_reviewed: asBoolean(row.hitl_reviewed),
    drift: buildDriftCone(
      asNumber(row.centroid_lat),
      asNumber(row.centroid_lon),
    ),
    sources: (sourcesBySlick[row.id] ?? []).slice(0, 3),
  }));

  const tracksByVessel = aisRows.reduce((groups, row) => {
    const track = (groups[row.vessel_id] ??= {
      vessel_id: row.vessel_id,
      related_source_id: row.vessel_id,
      positions: [],
      timestamps: [],
      speed: 0,
      heading: 0,
    });
    track.positions.push([asNumber(row.lon), asNumber(row.lat)]);
    track.timestamps.push(row.timestamp);
    track.speed = asNumber(row.speed_knots);
    track.heading = asNumber(row.heading_deg);
    return groups;
  }, {});

  return { slicks, aisTracks: Object.values(tracksByVessel) };
};

export default {
  getMarineEyeData,
};
