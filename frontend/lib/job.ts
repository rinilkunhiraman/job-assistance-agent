export const EXPERIENCE_LEVELS = ["Entry", "Mid", "Senior"] as const;
export const TONES = [
  "Professional",
  "Friendly",
  "Confident",
  "Direct",
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];
export type Tone = (typeof TONES)[number];

export type JobRequest = {
  resume: string;
  job_description: string;
  target_role: string;
  experience_level: ExperienceLevel;
  tone: Tone;
  achievements?: string;
};

export type JobResponse = {
  fit_summary: string;
  resume_improvements: string;
  outreach_message: string;
  cover_letter: string;
  keywords: {
    matched: string[];
    missing: string[];
  };
};

export type ApiErrorResponse = {
  error: string;
  code: string;
};

export type FormState = {
  resume: string;
  job_description: string;
  target_role: string;
  experience_level: string;
  tone: string;
  achievements: string;
};

export function getInitialFormState(): FormState {
  return {
    resume: "",
    job_description: "",
    target_role: "",
    experience_level: "",
    tone: "",
    achievements: "",
  };
}

export function validateJobForm(form: FormState): string | null {
  const resume = form.resume.trim();
  const jobDescription = form.job_description.trim();
  const targetRole = form.target_role.trim();
  const achievements = form.achievements.trim();

  if (resume.length < 100) {
    return "Resume must be at least 100 characters.";
  }

  if (jobDescription.length < 100) {
    return "Job description must be at least 100 characters.";
  }

  if (targetRole.length < 2) {
    return "Target role must be at least 2 characters.";
  }

  if (!EXPERIENCE_LEVELS.includes(form.experience_level as ExperienceLevel)) {
    return "Select a valid experience level.";
  }

  if (!TONES.includes(form.tone as Tone)) {
    return "Select a valid tone.";
  }

  if (achievements.length > 4000) {
    return "Achievements must be 4000 characters or fewer.";
  }

  return null;
}

export function toJobRequest(form: FormState): JobRequest {
  return {
    resume: form.resume.trim(),
    job_description: form.job_description.trim(),
    target_role: form.target_role.trim(),
    experience_level: form.experience_level as ExperienceLevel,
    tone: form.tone as Tone,
    achievements: form.achievements.trim() || undefined,
  };
}
