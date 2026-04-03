from __future__ import annotations

import json
import logging
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from bson import ObjectId
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

from analysis_core import analyze_day
from auth_utils import (
    create_access_token,
    decode_access_token,
    hash_password,
    serialize_user,
    verify_password,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI(title="Trip Segment Correction API")
api_router = APIRouter(prefix="/api")
auth_scheme = HTTPBearer(auto_error=False)

mongo_url = os.environ.get("MONGO_URL")
if not mongo_url:
    raise RuntimeError("MONGO_URL environment variable is missing")

db_name = os.environ.get("DB_NAME", "trip_segment_app")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]
users_collection = db.users
admin_logs_collection = db.admin_logs


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


class CreateUserRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    role: str = Field(default="user")


class UpdateUserRequest(BaseModel):
    is_active: bool | None = None
    role: str | None = None


async def ensure_indexes_and_seed() -> None:
    await users_collection.create_index("username", unique=True)

    existing_count = await users_collection.count_documents({})
    if existing_count:
        return

    username = os.environ.get("DEFAULT_ADMIN_USERNAME", "ahabus").strip()
    password = os.environ.get("DEFAULT_ADMIN_PASSWORD", "71897382").strip()[:72]
    now = datetime.now(timezone.utc)

    await users_collection.insert_one(
        {
            "username": username,
            "password_hash": hash_password(password),
            "role": "owner",
            "is_active": True,
            "created_at": now,
            "last_login_at": None,
        }
    )
    logger.info("Seeded default owner/admin account: %s", username)


@app.on_event("startup")
async def startup_event() -> None:
    await ensure_indexes_and_seed()


@app.on_event("shutdown")
async def shutdown_event() -> None:
    client.close()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(auth_scheme),
) -> dict[str, Any]:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        payload = decode_access_token(credentials.credentials)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc

    username = payload.get("sub")
    user = await users_collection.find_one({"username": username})
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is inactive or missing")

    return user


async def require_admin(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    if current_user.get("role") not in {"owner", "admin"}:
        raise HTTPException(status_code=403, detail="Owner/Admin access required")
    return current_user


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


@api_router.post("/auth/login")
async def login(payload: LoginRequest) -> JSONResponse:
    user = await users_collection.find_one({"username": payload.username})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="This account is deactivated")

    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login_at": datetime.now(timezone.utc)}},
    )
    refreshed_user = await users_collection.find_one({"_id": user["_id"]})
    token = create_access_token(user["username"], user["role"])

    return JSONResponse(
        {
            "access_token": token,
            "token_type": "bearer",
            "user": serialize_user(refreshed_user),
        }
    )


@api_router.get("/auth/me")
async def me(current_user: dict[str, Any] = Depends(get_current_user)) -> JSONResponse:
    return JSONResponse({"user": serialize_user(current_user)})


@api_router.get("/admin/users")
async def list_users(_: dict[str, Any] = Depends(require_admin)) -> JSONResponse:
    users = await users_collection.find({}, sort=[("created_at", 1)]).to_list(length=200)
    return JSONResponse({"users": [serialize_user(user) for user in users]})


@api_router.post("/admin/users")
async def create_user(
    payload: CreateUserRequest,
    current_user: dict[str, Any] = Depends(require_admin),
) -> JSONResponse:
    role = payload.role if payload.role in {"owner", "admin", "user"} else "user"

    existing = await users_collection.find_one({"username": payload.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    now = datetime.now(timezone.utc)
    result = await users_collection.insert_one(
        {
            "username": payload.username,
            "password_hash": hash_password(payload.password[:72]),
            "role": role,
            "is_active": True,
            "created_at": now,
            "last_login_at": None,
        }
    )
    created_user = await users_collection.find_one({"_id": result.inserted_id})

    await admin_logs_collection.insert_one(
        {
            "actor_username": current_user["username"],
            "action": "create_user",
            "target_username": payload.username,
            "timestamp": now,
        }
    )

    return JSONResponse({"user": serialize_user(created_user)})


@api_router.patch("/admin/users/{user_id}")
async def update_user(
    user_id: str,
    payload: UpdateUserRequest,
    current_user: dict[str, Any] = Depends(require_admin),
) -> JSONResponse:
    try:
        object_id = ObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid user id") from exc

    target = await users_collection.find_one({"_id": object_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if target["username"] == current_user["username"] and payload.is_active is False:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")

    updates: dict[str, Any] = {}
    if payload.is_active is not None:
        updates["is_active"] = payload.is_active
    if payload.role in {"owner", "admin", "user"}:
        updates["role"] = payload.role

    if not updates:
        raise HTTPException(status_code=400, detail="No valid updates supplied")

    await users_collection.update_one({"_id": object_id}, {"$set": updates})
    updated = await users_collection.find_one({"_id": object_id})

    await admin_logs_collection.insert_one(
        {
            "actor_username": current_user["username"],
            "action": "update_user",
            "target_username": updated["username"],
            "updates": updates,
            "timestamp": datetime.now(timezone.utc),
        }
    )

    return JSONResponse({"user": serialize_user(updated)})


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
    private_trip_overrides: str | None = Form(None),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> JSONResponse:
    gps_path = None
    webtrack_path = None

    try:
        if Path(gps_file.filename or "").suffix.lower() not in {".csv", ".xlsx", ".xls"}:
            raise HTTPException(status_code=400, detail="GPS file must be CSV or Excel (.xlsx/.xls)")

        if Path(webtrack_file.filename or "").suffix.lower() not in {".pdf", ".xlsx", ".xls", ".csv"}:
            raise HTTPException(status_code=400, detail="WebTrack file must be PDF or Excel/CSV")

        if radius_m < 200 or radius_m > 500:
            raise HTTPException(status_code=400, detail="Home zone radius must be between 200 and 500 meters")

        gps_path = await _persist_upload(gps_file, "gps-upload.csv")
        webtrack_path = await _persist_upload(webtrack_file, "webtrack-upload.pdf")
        trip_overrides = json.loads(private_trip_overrides) if private_trip_overrides else []

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
            private_trip_overrides=trip_overrides,
        )

        result["upload_summary"] = {
            "gps_filename": gps_file.filename,
            "webtrack_filename": webtrack_file.filename,
            "gps_file_type": Path(gps_file.filename or "").suffix.lower(),
            "webtrack_file_type": Path(webtrack_file.filename or "").suffix.lower(),
            "requested_by": current_user["username"],
        }

        return JSONResponse(content=result)

    except HTTPException:
        raise
    except Exception as exc:
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