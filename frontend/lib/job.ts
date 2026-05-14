export const EXPERIENCE_LEVELS = ["Entry", "Mid", "Senior"] as const;
export const TONES = [
  "Professional",
  "Friendly",
  "Confident",
  "Direct",
] as const;

import { z } from "zod";

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];
export type Tone = (typeof TONES)[number];

export const jobFormSchema = z.object({
  resume: z.string().min(100, "Resume must be at least 100 characters."),
  job_description: z
    .string()
    .min(100, "Job description must be at least 100 characters."),
  target_role: z.string().min(2, "Target role must be at least 2 characters."),
  company_name: z
    .string()
    .max(120, "Company name must be 120 characters or fewer.")
    .optional()
    .or(z.literal("")),
  experience_level: z.enum(EXPERIENCE_LEVELS),
  tone: z.enum(TONES),
  achievements: z
    .string()
    .max(4000, "Achievements must be 4000 characters or fewer.")
    .optional()
    .or(z.literal("")),
});

export type JobRequest = z.infer<typeof jobFormSchema>;
export type FormState = z.infer<typeof jobFormSchema>;

export type FitAnalysisOutput = {
  fit_rating: string;
  fit_justification: string;
  summary: string;
  matched_skills: string[];
  missing_skills: string[];
  seniority_gap: boolean;
  seniority_note: string | null;
  career_gap_detected?: boolean;
  career_gap_note?: string | null;
};

export type ResumeOptimizationOutput = {
  ats_keywords: string[];
  professional_summary: string;
  skills: Record<string, string[]>;
  experience_bullets: Record<string, string[]>;
  improvement_notes: string[];
};

export type OutreachOutput = {
  message: string;
  company_name: string | null;
  hook_skills: string[];
};

export type CoverLetterOutput = {
  salutation: string;
  opening_paragraph: string;
  body_paragraph_1: string;
  body_paragraph_2: string;
  closing_paragraph: string;
  sign_off: string;
  company_name: string;
  word_count: number;
};

export type SkillGapItem = {
  skill: string;
  impact: string;
  time_to_competency: string;
  resource_type: string;
  concrete_action: string;
};

export type GapAnalysisOutput = {
  overall_verdict: string;
  quick_wins: string[];
  skill_gaps: SkillGapItem[];
  thirty_day_plan: string[];
  sixty_day_plan: string[];
  ninety_day_plan: string[];
  seniority_advice: string | null;
  career_gap_advice: string | null;
};

export type JobResponse = {
  fit: FitAnalysisOutput;
  resume: ResumeOptimizationOutput;
  outreach: OutreachOutput;
  cover_letter: CoverLetterOutput;
  gap?: GapAnalysisOutput | null;
};

export type ApiErrorResponse = {
  error: string;
  code: string;
};

export function getInitialFormState(): FormState {
  return {
    resume: "",
    job_description: "",
    target_role: "",
    company_name: "",
    experience_level: "" as any,
    tone: "" as any,
    achievements: "",
  };
}

export function toJobRequest(form: FormState): JobRequest {
  if (!form.experience_level || !form.tone) {
    throw new Error("Experience level and tone are required");
  }
  return {
    resume: form.resume,
    job_description: form.job_description,
    target_role: form.target_role,
    company_name: form.company_name?.trim() || undefined,
    experience_level: form.experience_level,
    tone: form.tone,
    achievements: form.achievements?.trim() || undefined,
  };
}
