import json
import logging
from time import perf_counter
from typing import AsyncGenerator

from crewai import LLM

from app.core.config import get_settings
from app.schemas.job import JobRequest, JobResponse
from app.schemas.pipeline_outputs import (
    FitAnalysisOutput,
    ResumeOptimizationOutput,
    OutreachOutput,
    CoverLetterOutput,
)
from app.agents.factory import (
    get_fit_evaluator,
    get_resume_optimizer,
    get_outreach_writer,
    get_cover_letter_writer,
)
from app.tasks.factory import (
    build_fit_task,
    build_resume_task,
    build_outreach_task,
    build_cover_task,
)
from app.services.pipeline import execute_single_task, build_llm
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)
settings = get_settings()

async def run_job_pipeline_stream(
    req: JobRequest,
    *,
    request_id: str = "unknown",
) -> AsyncGenerator[str, None]:
    pipeline_started_at = perf_counter()
    
    yield json.dumps({"type": "progress", "message": "Starting job application pipeline..."})
    
    llm = build_llm()

    # 1. Run Fit Evaluation first
    yield json.dumps({"type": "progress", "message": "Analyzing technical fit and skill gaps..."})
    
    fit_evaluator = get_fit_evaluator(llm)
    fit_task = build_fit_task(fit_evaluator, req)
    
    # execute_single_task is synchronous, so it blocks here, which is fine for the sequential step
    fit_raw = execute_single_task(fit_evaluator, fit_task, settings.crew_verbose)
    
    if not fit_raw:
        yield json.dumps({"type": "error", "message": "Fit analysis failed."})
        return

    fit_context = FitAnalysisOutput(**fit_raw)
    yield json.dumps({"type": "progress", "message": f"Fit analysis complete: {fit_context.fit_rating}."})

    # 2. Run remaining tasks in parallel
    yield json.dumps({"type": "progress", "message": "Optimizing resume and writing outreach materials..."})
    
    resume_optimizer = get_resume_optimizer(llm)
    outreach_writer = get_outreach_writer(llm)
    cover_letter_writer = get_cover_letter_writer(llm)

    tasks_to_run = {
        "resume": (resume_optimizer, build_resume_task(resume_optimizer, req, fit_context)),
        "outreach": (outreach_writer, build_outreach_task(outreach_writer, req, fit_context)),
        "cover_letter": (cover_letter_writer, build_cover_task(cover_letter_writer, req, fit_context)),
    }

    results = {"fit": fit_context}
    
    with ThreadPoolExecutor(max_workers=len(tasks_to_run)) as executor:
        future_to_name = {
            executor.submit(execute_single_task, agent, task, settings.crew_verbose): name
            for name, (agent, task) in tasks_to_run.items()
        }
        
        for future in as_completed(future_to_name):
            name = future_to_name[future]
            try:
                data = future.result()
                if data:
                    if name == "resume":
                        results[name] = ResumeOptimizationOutput(**data)
                        yield json.dumps({"type": "progress", "message": "Resume optimization complete."})
                    elif name == "outreach":
                        results[name] = OutreachOutput(**data)
                        yield json.dumps({"type": "progress", "message": "Outreach message complete."})
                    elif name == "cover_letter":
                        results[name] = CoverLetterOutput(**data)
                        yield json.dumps({"type": "progress", "message": "Cover letter complete."})
                else:
                    results[name] = None
            except Exception:
                logger.exception("task_failed task_name=%s", name)
                results[name] = None

    # 3. Send final response
    response = JobResponse(
        fit=results["fit"],
        resume=results.get("resume") or ResumeOptimizationOutput(
            ats_keywords=[], professional_summary="Failed", skills={}, experience_bullets={}, improvement_notes=["Optimization failed."]
        ),
        outreach=results.get("outreach") or OutreachOutput(
            message="Failed to generate outreach.", company_name=None, hook_skills=[]
        ),
        cover_letter=results.get("cover_letter") or CoverLetterOutput(
            salutation="Dear Hiring Team,",
            opening_paragraph="Failed to generate.",
            body_paragraph_1="Failed to generate.",
            body_paragraph_2="Failed to generate.",
            closing_paragraph="Failed to generate.",
            sign_off="Best regards,",
            company_name="Company",
            word_count=0
        ),
    )

    pipeline_elapsed_ms = round((perf_counter() - pipeline_started_at) * 1000, 2)
    logger.info("pipeline_completed request_id=%s duration_ms=%s", request_id, pipeline_elapsed_ms)
    
    yield json.dumps({"type": "final_result", "data": response.model_dump()})
