from fastapi import APIRouter, Request

from app.schemas.error import ErrorResponse
from app.schemas.job import JobRequest, JobResponse
from app.services.pipeline import run_job_pipeline

router = APIRouter()


@router.post(
    "/run",
    response_model=JobResponse,
    responses={
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
    },
)
def run_job(req: JobRequest, request: Request) -> JobResponse:
    request_id = getattr(request.state, "request_id", "unknown")
    return run_job_pipeline(req, request_id=request_id)
