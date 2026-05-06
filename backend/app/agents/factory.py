from crewai import Agent, LLM

def get_fit_evaluator(llm: LLM) -> Agent:
    return Agent(
        role="Fit Evaluator",
        goal="Compare candidate with job requirements",
        backstory="Expert hiring analyst",
        llm=llm,
    )

def get_resume_optimizer(llm: LLM) -> Agent:
    return Agent(
        role="Resume Optimizer",
        goal="Improve resume based on job requirements",
        backstory="Professional resume writer",
        llm=llm,
    )

def get_outreach_writer(llm: LLM) -> Agent:
    return Agent(
        role="Candidate Outreach Specialist",
        goal=(
            "Write short, high-conversion messages FROM a candidate TO a "
            "recruiter or hiring manager"
        ),
        backstory=(
            "Expert in job search communication, helping candidates "
            "reach out professionally and confidently"
        ),
        llm=llm,
    )

def get_cover_letter_writer(llm: LLM) -> Agent:
    return Agent(
        role="Cover Letter Writer",
        goal="Write tailored cover letters",
        backstory="Expert in job applications",
        llm=llm,
    )
