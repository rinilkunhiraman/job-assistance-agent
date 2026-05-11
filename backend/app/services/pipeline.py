import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from time import perf_counter

from crewai import Crew, LLM

from app.core.config import get_settings
from app.core.exceptions import PipelineExecutionError
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

logger = logging.getLogger(__name__)
settings = get_settings()

def build_llm() -> LLM:
    return LLM(
        model=settings.ollama_model,
        base_url=settings.ollama_base_url,
    )

def execute_single_task(agent, task, verbose: bool):
    crew = Crew(
        agents=[agent],
        tasks=[task],
        verbose=verbose,
        memory=False,
    )
    result = crew.kickoff()
    
    output = result.tasks_output[0]
    if not output.json_dict:
        logger.warning("Task did not return json_dict: %s", output.raw)
        return None
    return output.json_dict

def run_job_pipeline(
    req: JobRequest,
    *,
    request_id: str = "unknown",
) -> JobResponse:
    pipeline_started_at = perf_counter()
    logger.info(
        "pipeline_started request_id=%s target_role=%s experience_level=%s tone=%s",
        request_id, req.target_role, req.experience_level, req.tone
    )

    llm = build_llm()

    # 1. Run Fit Evaluation first for collaboration
    fit_evaluator = get_fit_evaluator(llm)
    fit_task = build_fit_task(fit_evaluator, req)
    
    logger.info("pipeline_fit_started request_id=%s", request_id)
    fit_raw = execute_single_task(fit_evaluator, fit_task, settings.crew_verbose)
    
    if not fit_raw:
        logger.error("pipeline_fit_failed request_id=%s", request_id)
        raise PipelineExecutionError("Fit analysis failed. Pipeline cannot continue.")
    
    fit_context = FitAnalysisOutput(**fit_raw)
    logger.info("pipeline_fit_completed request_id=%s", request_id)

    # 2. Build remaining tasks with fit_context
    resume_optimizer = get_resume_optimizer(llm)
    outreach_writer = get_outreach_writer(llm)
    cover_letter_writer = get_cover_letter_writer(llm)

    tasks_to_run = {
        "resume": (resume_optimizer, build_resume_task(resume_optimizer, req, fit_context)),
        "outreach": (outreach_writer, build_outreach_task(outreach_writer, req, fit_context)),
        "cover_letter": (cover_letter_writer, build_cover_task(cover_letter_writer, req, fit_context)),
    }

    results = {"fit": fit_context}
    
    kickoff_started_at = perf_counter()
    logger.info("pipeline_parallel_tasks_started request_id=%s", request_id)

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
                    elif name == "outreach":
                        results[name] = OutreachOutput(**data)
                    elif name == "cover_letter":
                        results[name] = CoverLetterOutput(**data)
                    logger.info("task_completed request_id=%s task_name=%s", request_id, name)
                else:
                    logger.warning("task_returned_no_data request_id=%s task_name=%s", request_id, name)
                    results[name] = None
            except Exception as exc:
                logger.exception("task_failed request_id=%s task_name=%s", request_id, name)
                results[name] = None
                
    kickoff_elapsed_ms = round((perf_counter() - kickoff_started_at) * 1000, 2)
    logger.info("pipeline_parallel_tasks_finished request_id=%s duration_ms=%s", request_id, kickoff_elapsed_ms)

    # Ensure we have something for all fields, even if failed
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
    return response
