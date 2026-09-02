from __future__ import annotations

import csv
import json
import sqlite3
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

SERVER_DIR = Path(__file__).resolve().parent
DATA_DIR = SERVER_DIR.parent
DATABASE_PATH = SERVER_DIR / "marineeye.db"
SLICK_CSV = DATA_DIR / "mock_slick_detections.csv"
SOURCE_CSV = DATA_DIR / "mock_sources.csv"
AIS_CSV = DATA_DIR / "mock_ais_tracks.csv"

app = FastAPI(title="MarineEye Demo API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def as_float(value: str | None, default: float = 0) -> float:
    return float(value) if value not in (None, "") else default


def as_bool(value: str | None) -> bool:
    return str(value).lower() in {"true", "1", "yes"}


def polygon_from_wkt(value: str) -> dict[str, Any]:
    coordinates = []
    body = value.removeprefix("POLYGON((").removesuffix("))")
    for pair in body.split(","):
        longitude, latitude = pair.strip().split()
        coordinates.append([float(longitude), float(latitude)])
    return {"type": "Polygon", "coordinates": [coordinates]}


def build_drift(latitude: float, longitude: float) -> dict[str, list[dict[str, Any]]]:
    return {
        "hindcast": [
            {
                "t_offset_hours": -(index + 1) * 8,
                "center": [longitude, latitude],
                "radius_km": round(1.8 + index * 1.8, 2),
            }
            for index in range(5)
        ],
        "forecast": [
            {
                "t_offset_hours": (index + 1) * 6,
                "center": [longitude, latitude],
                "radius_km": round(0.8 + index * 0.8, 2),
            }
            for index in range(4)
        ],
    }


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialise_database() -> None:
    with connect() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS slicks (
                id TEXT PRIMARY KEY, timestamp TEXT NOT NULL, sensor TEXT,
                scene_id TEXT, class TEXT NOT NULL, detection_confidence REAL,
                slick_confidence REAL, area REAL, age_estimate REAL,
                centroid_lat REAL, centroid_lon REAL, polygon_wkt TEXT,
                hitl_reviewed INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sources (
                slick_id TEXT NOT NULL, rank INTEGER NOT NULL, source_id TEXT NOT NULL,
                type TEXT NOT NULL, cpa REAL, tcpa REAL, drift_overlap REAL,
                ais_gap_anomaly REAL, behavioral_anomaly REAL, fused_score REAL,
                dominant_factor TEXT, navic_tracked INTEGER NOT NULL,
                PRIMARY KEY (slick_id, rank)
            );
            CREATE TABLE IF NOT EXISTS ais_tracks (
                vessel_id TEXT NOT NULL, timestamp TEXT NOT NULL, latitude REAL,
                longitude REAL, speed REAL, heading REAL, linked_slick_id TEXT
            );
            """
        )

        if connection.execute("SELECT COUNT(*) FROM slicks").fetchone()[0] == 0:
            with SLICK_CSV.open(newline="", encoding="utf-8") as file:
                rows = [
                    (
                        row["id"], row["timestamp"], row["sensor"], row["scene_id"],
                        row["class"], as_float(row["detection_confidence"]),
                        as_float(row["slick_confidence"]), as_float(row["area_km2"]),
                        as_float(row["age_estimate_hours"]), as_float(row["centroid_lat"]),
                        as_float(row["centroid_lon"]), row["polygon_wkt"],
                        int(as_bool(row["hitl_reviewed"])),
                    )
                    for row in csv.DictReader(file)
                ]
            connection.executemany("INSERT INTO slicks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", rows)

        if connection.execute("SELECT COUNT(*) FROM sources").fetchone()[0] == 0:
            with SOURCE_CSV.open(newline="", encoding="utf-8") as file:
                rows = []
                for row in csv.DictReader(file):
                    rows.append((
                        row["slick_id"], int(row["rank"]), row["source_id"], row["type"],
                        as_float(row["cpa"]), as_float(row["tcpa"]), as_float(row["drift_overlap"]),
                        as_float(row["ais_gap_anomaly"]), as_float(row["behavioral_anomaly"]),
                        as_float(row["fused_score"]), row["dominant_factor"],
                        int(as_bool(row["navic_tracked"])),
                    ))
            connection.executemany("INSERT INTO sources VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", rows)

        if connection.execute("SELECT COUNT(*) FROM ais_tracks").fetchone()[0] == 0:
            with AIS_CSV.open(newline="", encoding="utf-8") as file:
                rows = [
                    (
                        row["vessel_id"], row["timestamp"], as_float(row["lat"]),
                        as_float(row["lon"]), as_float(row["speed_knots"]),
                        as_float(row["heading_deg"]), row["linked_slick_id"] or None,
                    )
                    for row in csv.DictReader(file)
                ]
            connection.executemany("INSERT INTO ais_tracks VALUES (?, ?, ?, ?, ?, ?, ?)", rows)


def read_data(slick_id: str | None = None) -> dict[str, list[dict[str, Any]]]:
    with connect() as connection:
        slick_rows = connection.execute(
            "SELECT * FROM slicks WHERE (? IS NULL OR id = ?) ORDER BY timestamp",
            (slick_id, slick_id),
        ).fetchall()
        if slick_id and not slick_rows:
            raise HTTPException(status_code=404, detail=f"Slick {slick_id} was not found")

        sources = connection.execute(
            "SELECT * FROM sources WHERE (? IS NULL OR slick_id = ?) ORDER BY slick_id, rank",
            (slick_id, slick_id),
        ).fetchall()
        source_map: dict[str, list[dict[str, Any]]] = {}
        for source in sources:
            source_map.setdefault(source["slick_id"], []).append({
                "id": source["source_id"],
                "type": source["type"],
                "sub_scores": {
                    "cpa": source["cpa"], "tcpa": source["tcpa"],
                    "drift_overlap": source["drift_overlap"],
                    "ais_gap_anomaly": source["ais_gap_anomaly"],
                    "behavioral_anomaly": source["behavioral_anomaly"],
                },
                "fused_score": source["fused_score"],
                "dominant_factor": source["dominant_factor"],
                "navic_tracked": bool(source["navic_tracked"]),
            })

        slicks = []
        for row in slick_rows:
            slicks.append({
                "id": row["id"], "polygon": polygon_from_wkt(row["polygon_wkt"]),
                "class": row["class"], "detection_confidence": row["detection_confidence"],
                "slick_confidence": row["slick_confidence"], "area": row["area"],
                "age_estimate": row["age_estimate"], "timestamp": row["timestamp"],
                "hitl_reviewed": bool(row["hitl_reviewed"]),
                "drift": build_drift(row["centroid_lat"], row["centroid_lon"]),
                "sources": source_map.get(row["id"], [])[:3],
            })

        ais_rows = connection.execute(
            "SELECT * FROM ais_tracks WHERE (? IS NULL OR linked_slick_id = ? OR linked_slick_id IS NULL) ORDER BY vessel_id, timestamp",
            (slick_id, slick_id),
        ).fetchall()
        tracks_by_vessel: dict[str, dict[str, Any]] = {}
        for row in ais_rows:
            track = tracks_by_vessel.setdefault(row["vessel_id"], {
                "vessel_id": row["vessel_id"], "related_source_id": None,
                "positions": [], "timestamps": [], "speed": row["speed"], "heading": row["heading"],
            })
            track["positions"].append([row["longitude"], row["latitude"]])
            track["timestamps"].append(row["timestamp"])
            track["speed"] = row["speed"]
            track["heading"] = row["heading"]
            if row["linked_slick_id"] == slick_id:
                track["related_source_id"] = row["vessel_id"]

    return {"slicks": slicks, "aisTracks": list(tracks_by_vessel.values())}


@app.on_event("startup")
def startup() -> None:
    initialise_database()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/data")
def data(slick_id: str | None = Query(default=None)) -> dict[str, list[dict[str, Any]]]:
    return read_data(slick_id)


@app.get("/api/slicks")
def slicks() -> list[dict[str, Any]]:
    return read_data()["slicks"]


@app.get("/api/ais-tracks")
def ais_tracks() -> list[dict[str, Any]]:
    return read_data()["aisTracks"]
