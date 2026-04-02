from __future__ import annotations

import logging
import os
import tempfile
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from analysis_core import analyze_day


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI(title="Trip Segment Correction API")
api_router = APIRouter(prefix="/api")


def _allowed_file(filename: str | None, allowed: set[str]) -> bool:
    if not filename:
        return False
    return Path(filename).suffix.lower() in allowed


async def _persist_upload(upload: UploadFile, fallback_name: str) -> str:
    suffix = Path(upload.filename or fallback_name).suffix or ".tmp"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix, prefix="trip-segment-") as temp_file:
        while True:
            chunk = await upload.read(1024 * 1024)
            if not chunk:
                break
            temp_file.write(chunk)
        return temp_file.name


@api_router.get("/")
async def root() -> dict[str, str]:
    return {"message": "Trip Segment Correction API"}


@api_router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@api_router.post("/analyze")
async def analyze_trip(
    gps_file: UploadFile = File(...),
    webtrack_file: UploadFile = File(...),
    home_lat: float = Form(...),
    home_lon: float = Form(...),
    radius_m: float = Form(300),
    dwell_minutes: int = Form(10),
    stable_points: int = Form(3),
    last_order_lat: float | None = Form(None),
    last_order_lon: float | None = Form(None),
) -> JSONResponse:
    if not _allowed_file(gps_file.filename, {".csv", ".xlsx", ".xls"}):
        raise HTTPException(status_code=400, detail="GPS file must be CSV or Excel (.xlsx/.xls)")
    if not _allowed_file(webtrack_file.filename, {".pdf", ".xlsx", ".xls", ".csv"}):
        raise HTTPException(status_code=400, detail="WebTrack file must be PDF or Excel/CSV")
    if radius_m < 200 or radius_m > 500:
        raise HTTPException(status_code=400, detail="Home zone radius must be between 200 and 500 meters")
    if dwell_minutes < 1 or dwell_minutes > 60:
        raise HTTPException(status_code=400, detail="Return dwell must be between 1 and 60 minutes")
    if stable_points < 2 or stable_points > 5:
        raise HTTPException(status_code=400, detail="Stable detection points must be between 2 and 5")

    gps_path = None
    webtrack_path = None
    try:
        gps_path = await _persist_upload(gps_file, "gps-upload.csv")
        webtrack_path = await _persist_upload(webtrack_file, "webtrack-upload.pdf")

        logger.info(
            "Running analysis for gps=%s webtrack=%s radius=%s dwell=%s stable_points=%s",
            gps_file.filename,
            webtrack_file.filename,
            radius_m,
            dwell_minutes,
            stable_points,
        )

        result = analyze_day(
            gps_path=gps_path,
            webtrack_path=webtrack_path,
            home_latitude=home_lat,
            home_longitude=home_lon,
            radius_meters=radius_m,
            min_return_dwell_minutes=dwell_minutes,
            stable_point_count=stable_points,
            last_order_latitude=last_order_lat,
            last_order_longitude=last_order_lon,
        )
        response: dict[str, Any] = {
            **result,
            "upload_summary": {
                "gps_filename": gps_file.filename,
                "webtrack_filename": webtrack_file.filename,
                "gps_file_type": Path(gps_file.filename or "").suffix.lower(),
                "webtrack_file_type": Path(webtrack_file.filename or "").suffix.lower(),
            },
        }
        return JSONResponse(content=response)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("Analysis failed")
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        for path in [gps_path, webtrack_path]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                except OSError:
                    logger.warning("Could not remove temp file: %s", path)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
