from collections.abc import AsyncIterator

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import StreamingResponse

from app.deps import ChatServiceDep, SettingsDep
from app.schemas import ChatRequest, ContentBlock

router = APIRouter(prefix="/chat", tags=["chat"])

SSE_HEADERS = {
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
}


def _get_char_count(content: str | list[ContentBlock]) -> int:
    if isinstance(content, str):
        return len(content)
    return sum(len(b.text or "") for b in content if b.type == "text")


@router.post(
    "",
    response_class=StreamingResponse,
    responses={200: {"content": {"text/event-stream": {}}}},
)
async def chat(
    body: ChatRequest, request: Request, service: ChatServiceDep, settings: SettingsDep
) -> StreamingResponse:
    """Stream a reply as server-sent events.

    Events: `meta` (which provider/model answered), unnamed `data: {"delta": ...}`
    chunks, then `done` or `error`.
    """
    if len(body.messages) > settings.max_messages:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Too many messages")
    if any(_get_char_count(m.content) > settings.max_message_chars for m in body.messages):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Message is too long")
    if body.messages[-1].role != "user":
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Last message must be user")

    async def events() -> AsyncIterator[str]:
        async for event in service.stream(body):
            if await request.is_disconnected():
                break
            yield event.to_sse()

    return StreamingResponse(events(), media_type="text/event-stream", headers=SSE_HEADERS)
