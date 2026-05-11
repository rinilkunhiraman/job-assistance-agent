from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.schemas.error import ErrorResponse
from app.schemas.job import JobRequest, JobResponse
from app.services.stream_pipeline import run_job_pipeline_stream

router = APIRouter()


@router.post(
    "/run",
    responses={
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
    },
)
async def run_job(req: JobRequest, request: Request):
    request_id = getattr(request.state, "request_id", "unknown")
    return StreamingResponse(
        run_job_pipeline_stream(req, request_id=request_id),
        media_type="text/event-stream",
    )
