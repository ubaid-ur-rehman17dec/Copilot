"""Utilities for reading and encoding images for multimodal model requests."""

import asyncio
import base64
import mimetypes
from pathlib import Path


async def read_image_bytes(image_url: str) -> bytes | None:
    """Read bytes for a local static upload image or file path."""
    if not image_url:
        return None

    if image_url.startswith("/static/"):
        file_path = Path(image_url.lstrip("/"))
    elif image_url.startswith("static/"):
        file_path = Path(image_url)
    else:
        file_path = Path(image_url)

    if not file_path.exists() or not file_path.is_file():
        return None

    try:
        return await asyncio.to_thread(file_path.read_bytes)
    except OSError:
        return None


async def get_image_b64(image_url: str, mime_type: str | None = None) -> tuple[str | None, str]:
    """Return base64 encoded image string and inferred mime type."""
    if not image_url:
        return None, "image/jpeg"

    if image_url.startswith("data:"):
        # Format: data:image/png;base64,...
        header, _, b64_data = image_url.partition(";base64,")
        detected_mime = header.replace("data:", "") if header.startswith("data:") else "image/jpeg"
        return b64_data, mime_type or detected_mime

    data = await read_image_bytes(image_url)
    if not data:
        return None, mime_type or "image/jpeg"

    b64_str = base64.b64encode(data).decode("utf-8")
    if not mime_type:
        mime_type, _ = mimetypes.guess_type(image_url)
        mime_type = mime_type or "image/jpeg"

    return b64_str, mime_type


async def get_image_data_url(image_url: str, mime_type: str | None = None) -> str:
    """Return a data URL or absolute HTTP URL for image input."""
    if not image_url:
        return ""

    if image_url.startswith(("http://", "https://", "data:")):
        return image_url

    b64_data, detected_mime = await get_image_b64(image_url, mime_type)
    if not b64_data:
        return image_url

    return f"data:{detected_mime};base64,{b64_data}"
