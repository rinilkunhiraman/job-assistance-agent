from fastapi import APIRouter

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
def run_job(req: JobRequest) -> JobResponse:
    return run_job_pipeline(req)
