from fastapi import APIRouter
from app.schemas.job import JobRequest, JobResponse
from app.services.pipeline import run_job_pipeline

router = APIRouter()


@router.post("/run", response_model=JobResponse)
def run_job(req: JobRequest):
    result = run_job_pipeline(req)
    return result