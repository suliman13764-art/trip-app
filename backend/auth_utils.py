from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 12 * 60


def get_secret_key() -> str:
    return os.environ.get("JWT_SECRET", "change-me-in-env")



def hash_password(password: str) -> str:
    return pwd_context.hash(password)



def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)



def create_access_token(subject: str, role: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {"sub": subject, "role": role, "exp": expire}
    return jwt.encode(payload, get_secret_key(), algorithm=ALGORITHM)



def decode_access_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, get_secret_key(), algorithms=[ALGORITHM])
    except JWTError as exc:  # noqa: B904
        raise ValueError("Invalid or expired access token") from exc



def serialize_datetime(value: Any) -> str | None:
    if isinstance(value, datetime):
        return value.isoformat()
    return None



def serialize_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(user.get("_id")),
        "username": user.get("username"),
        "role": user.get("role"),
        "is_active": bool(user.get("is_active", True)),
        "created_at": serialize_datetime(user.get("created_at")),
        "last_login_at": serialize_datetime(user.get("last_login_at")),
    }
