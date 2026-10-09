import asyncio
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = Path("static/uploads")
try:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
except Exception as e:
    print(f"Warning: Could not create upload directory {UPLOAD_DIR}: {e}")


ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("")
async def upload_image(file: UploadFile = File(...)) -> dict[str, str]:  # noqa: B008
    if file.content_type not in ALLOWED_MIME_TYPES:
        allowed_str = ", ".join(sorted(ALLOWED_MIME_TYPES))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: {allowed_str}",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds maximum limit of 10MB",
        )

    extension = os.path.splitext(file.filename or "")[1]
    if not extension:
        extension = ".jpg" if file.content_type == "image/jpeg" else ".png"

    filename = f"{uuid.uuid4()}{extension}"
    file_path = UPLOAD_DIR / filename

    await asyncio.to_thread(file_path.write_bytes, content)

    return {
        "url": f"/static/uploads/{filename}",
        "mime_type": file.content_type or "image/jpeg",
    }
