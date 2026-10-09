import logging

from fastapi import status
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.schemas.error import ErrorResponse

logger = logging.getLogger(__name__)


class UnhandledErrorMiddleware:
    """Turns an exception nothing else handled into the project's 500 response.

    A handler registered for `Exception` runs in Starlette's outermost layer,
    outside every middleware added with add_middleware, so its response never
    passes through the CORS middleware and carries no CORS headers. A browser
    on another origin then cannot read it and reports a network failure.

    This middleware is added before the CORS one, which places it inside it:
    the 500 it sends goes out through CORS like any other response. The
    traceback is logged; the client is told only that something went wrong.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        response_started = False

        async def send_and_note(message: Message) -> None:
            nonlocal response_started
            if message["type"] == "http.response.start":
                response_started = True
            await send(message)

        try:
            await self.app(scope, receive, send_and_note)
        except Exception:
            logger.exception("Unhandled error")
            # Part of a response has gone out already: nothing valid can follow it.
            if response_started:
                raise

            response = JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content=ErrorResponse(
                    success=False,
                    code="INTERNAL_SERVER_ERROR",
                    message="An unexpected error occurred.",
                ).model_dump(),
            )
            await response(scope, receive, send)
