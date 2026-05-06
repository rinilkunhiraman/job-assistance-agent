import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from time import perf_counter

from crewai import Crew, LLM

from app.core.config import get_settings
from app.core.exceptions import PipelineExecutionError
from app.schemas.job import JobRequest, JobResponse, Keywords
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
        return {}
    return output.json_dict

def run_job_pipeline(
    req: JobRequest,
    *,
    request_id: str = "unknown",
) -> JobResponse:
    pipeline_started_at = perf_counter()
    logger.info(
        "pipeline_started request_id=%s target_role=%s experience_level=%s tone=%s resume_chars=%s job_description_chars=%s achievements_chars=%s model=%s",
        request_id,
        req.target_role,
        req.experience_level,
        req.tone,
        len(req.resume),
        len(req.job_description),
        len(req.achievements or ""),
        settings.ollama_model,
    )

    llm = build_llm()

    # Agents
    fit_evaluator = get_fit_evaluator(llm)
    resume_optimizer = get_resume_optimizer(llm)
    outreach_writer = get_outreach_writer(llm)
    cover_letter_writer = get_cover_letter_writer(llm)

    # Tasks
    fit_task = build_fit_task(fit_evaluator, req)
    resume_task = build_resume_task(resume_optimizer, req)
    outreach_task = build_outreach_task(outreach_writer, req)
    cover_task = build_cover_task(cover_letter_writer, req)

    tasks_to_run = {
        "fit": (fit_evaluator, fit_task),
        "resume": (resume_optimizer, resume_task),
        "outreach": (outreach_writer, outreach_task),
        "cover_letter": (cover_letter_writer, cover_task),
    }

    results = {}
    
    kickoff_started_at = perf_counter()
    logger.info("pipeline_tasks_started request_id=%s tasks_count=%s", request_id, len(tasks_to_run))

    with ThreadPoolExecutor(max_workers=len(tasks_to_run)) as executor:
        future_to_name = {
            executor.submit(execute_single_task, agent, task, settings.crew_verbose): name
            for name, (agent, task) in tasks_to_run.items()
        }
        
        for future in as_completed(future_to_name):
            name = future_to_name[future]
            try:
                data = future.result()
                results[name] = data
                logger.info("task_completed request_id=%s task_name=%s", request_id, name)
            except Exception as exc:
                logger.exception("task_failed request_id=%s task_name=%s", request_id, name)
                results[name] = None
                
    kickoff_elapsed_ms = round((perf_counter() - kickoff_started_at) * 1000, 2)
    logger.info("pipeline_tasks_finished request_id=%s duration_ms=%s", request_id, kickoff_elapsed_ms)

    # Safely extract data with fallbacks
    fit_data = results.get("fit") or {}
    resume_data = results.get("resume") or {}
    outreach_data = results.get("outreach") or {}
    cover_data = results.get("cover_letter") or {}

    response = JobResponse(
        fit_summary=fit_data.get("fit_summary", "Fit analysis failed or unavailable."),
        resume_improvements=resume_data.get("resume_improvements", "Resume improvements failed or unavailable."),
        outreach_message=outreach_data.get("outreach_message", "Outreach message failed or unavailable."),
        cover_letter=cover_data.get("cover_letter", "Cover letter failed or unavailable."),
        keywords=Keywords(
            matched=fit_data.get("matched_skills", []),
            missing=fit_data.get("missing_skills", []),
        ),
    )

    pipeline_elapsed_ms = round((perf_counter() - pipeline_started_at) * 1000, 2)
    logger.info(
        "pipeline_completed request_id=%s duration_ms=%s matched_keywords=%s missing_keywords=%s",
        request_id,
        pipeline_elapsed_ms,
        len(response.keywords.matched),
        len(response.keywords.missing),
    )
    return response
