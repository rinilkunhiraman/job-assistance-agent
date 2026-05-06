import json
from crewai import Agent, Task, Crew, LLM

from app.schemas.job import JobRequest, JobResponse, Keywords


# ---------------------------
# 🔧 Helper: Safe JSON parsing
# ---------------------------
def parse_json_safe(text: str):
    try:
        return json.loads(text)
    except Exception:
        return {}


# ---------------------------
# 🚀 Main Pipeline Function
# ---------------------------
def run_job_pipeline(req: JobRequest) -> JobResponse:

    # 🔹 LLM (Ollama)
    llm = LLM(
        model="ollama/gemma",
        base_url="http://localhost:11434"
    )

    # ---------------------------
    # 🤖 Agents
    # ---------------------------

    job_analyzer = Agent(
        role="Job Analyzer",
        goal="Extract structured insights from job descriptions",
        backstory="Expert in analyzing job postings and extracting key requirements",
        llm=llm
    )

    candidate_profiler = Agent(
        role="Candidate Profiler",
        goal="Analyze resumes and identify strengths",
        backstory="Expert in evaluating candidate profiles and experience",
        llm=llm
    )

    fit_evaluator = Agent(
        role="Fit Evaluator",
        goal="Compare candidate profile with job requirements",
        backstory="Expert hiring analyst",
        llm=llm
    )

    resume_optimizer = Agent(
        role="Resume Optimizer",
        goal="Improve resume based on job requirements",
        backstory="Professional resume writer",
        llm=llm
    )

    outreach_writer = Agent(
        role="Outreach Writer",
        goal="Write effective recruiter messages",
        backstory="Expert in professional communication",
        llm=llm
    )

    cover_letter_writer = Agent(
        role="Cover Letter Writer",
        goal="Write tailored cover letters",
        backstory="Expert in job applications",
        llm=llm
    )

    # ---------------------------
    # 📋 Tasks (STRICT JSON OUTPUT)
    # ---------------------------

    job_analysis_task = Task(
        description=f"""
Analyze this job description:

{req.job_description}

Return ONLY valid JSON:
{{
  "skills": [],
  "tools": [],
  "requirements": []
}}
""",
        expected_output="JSON with skills, tools, requirements",
        agent=job_analyzer
    )

    profile_task = Task(
        description=f"""
Analyze this resume:

{req.resume}

Return ONLY valid JSON:
{{
  "strengths": [],
  "experience_summary": "",
  "skills": []
}}
""",
        expected_output="Candidate profile JSON",
        agent=candidate_profiler
    )

    fit_task = Task(
        description="""
Compare job requirements and candidate profile.

Return ONLY valid JSON:
{
  "fit_summary": "",
  "matched_skills": [],
  "missing_skills": []
}
""",
        expected_output="Fit analysis JSON",
        agent=fit_evaluator
    )

    resume_task = Task(
        description="""
Improve resume based on job requirements.

Return ONLY valid JSON:
{
  "resume_improvements": ""
}
""",
        expected_output="Resume improvements JSON",
        agent=resume_optimizer
    )

    outreach_task = Task(
        description=f"""
Write a recruiter outreach message.

Role: {req.target_role}
Tone: {req.tone}

Return ONLY valid JSON:
{{
  "outreach_message": ""
}}
""",
        expected_output="Outreach JSON",
        agent=outreach_writer
    )

    cover_letter_task = Task(
        description=f"""
Write a tailored cover letter.

Role: {req.target_role}
Tone: {req.tone}

Return ONLY valid JSON:
{{
  "cover_letter": ""
}}
""",
        expected_output="Cover letter JSON",
        agent=cover_letter_writer
    )

    # ---------------------------
    # 🧠 Crew Execution
    # ---------------------------

    crew = Crew(
        agents=[
            job_analyzer,
            candidate_profiler,
            fit_evaluator,
            resume_optimizer,
            outreach_writer,
            cover_letter_writer
        ],
        tasks=[
            job_analysis_task,
            profile_task,
            fit_task,
            resume_task,
            outreach_task,
            cover_letter_task
        ],
        verbose=True,
        memory=False
    )

    result = crew.kickoff()

    # ---------------------------
    # 📊 Extract Task Outputs
    # ---------------------------

    task_outputs = result.tasks_output

    job_data = parse_json_safe(task_outputs[0].raw)
    profile_data = parse_json_safe(task_outputs[1].raw)
    fit_data = parse_json_safe(task_outputs[2].raw)
    resume_data = parse_json_safe(task_outputs[3].raw)
    outreach_data = parse_json_safe(task_outputs[4].raw)
    cover_data = parse_json_safe(task_outputs[5].raw)

    # ---------------------------
    # 📦 Final Structured Response
    # ---------------------------

    return JobResponse(
        fit_summary=fit_data.get("fit_summary", ""),
        resume_improvements=resume_data.get("resume_improvements", ""),
        outreach_message=outreach_data.get("outreach_message", ""),
        cover_letter=cover_data.get("cover_letter", ""),
        keywords=Keywords(
            matched=fit_data.get("matched_skills", []),
            missing=fit_data.get("missing_skills", [])
        )
    )