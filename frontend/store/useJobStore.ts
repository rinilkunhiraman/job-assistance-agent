import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  type FormState,
  getInitialFormState,
  type JobResponse,
} from "@/lib/job";

interface Resume {
  id: string;
  name: string;
  content: string;
  updatedAt: number;
}

interface HistoryEntry {
  id: string;
  createdAt: number;
  target_role: string;
  experience_level: string;
  tone: string;
  company_name: string | null;
  result: JobResponse;
}

interface JobUIState {
  showResume: boolean;
  showJobDescription: boolean;
  showPreferences: boolean;
  expandedHistoryId: string | null;
}

interface JobStatus {
  isPending: boolean;
  duration: number | null;
  result: JobResponse | null;
  errorMessage: string | null;
}

interface JobState {
  // Persistence
  resumes: Record<string, Resume>;
  activeResumeId: string | null;
  formValues: FormState;
  history: HistoryEntry[];

  // UI State
  ui: JobUIState;

  // Lifecycle
  jobStatus: JobStatus;

  // Actions
  actions: {
    setFieldValue: <K extends keyof FormState>(
      field: K,
      value: FormState[K],
    ) => void;
    saveResume: (name: string, content: string) => void;
    loadResume: (id: string) => void;
    deleteResume: (id: string) => void;
    startJob: () => void;
    endJob: (
      result: JobResponse | null,
      error: string | null,
      duration: number | null,
    ) => void;
    setDuration: (duration: number) => void;
    toggleSection: (section: keyof JobUIState) => void;
    closeAllSections: () => void;
    resetForm: () => void;
    saveToHistory: (entry: Omit<HistoryEntry, "id" | "createdAt">) => void;
    deleteFromHistory: (id: string) => void;
    clearHistory: () => void;
    toggleHistoryEntry: (id: string) => void;
  };
}

// Helper to extract company name from job description
function extractCompanyName(jobDescription: string): string | null {
  if (!jobDescription) return null;

  const text = jobDescription.trim();

  // Pattern 1: "at CompanyName" (common in job titles)
  const atMatch = text.match(/\bat\s+([A-Za-z][A-Za-z0-9\s&'()-]*?)(?:[,.\n]|$)/i);
  if (atMatch && atMatch[1].trim().length > 1) {
    return atMatch[1].trim();
  }

  // Pattern 2: Company/Employer/Organization: Name
  const labelMatch = text.match(/(?:company|employer|organization|hiring for|with)\s*[:\s]+([A-Za-z][A-Za-z0-9\s&'()-]*?)(?:[,.\n]|$)/i);
  if (labelMatch && labelMatch[1].trim().length > 1) {
    return labelMatch[1].trim();
  }

  // Pattern 3: First line often contains company name in job descriptions
  const firstLine = text.split('\n')[0];
  if (firstLine && firstLine.length < 100) {
    const cleanFirstLine = firstLine.replace(/^(job title|position|role)[:\s]*/i, '').trim();
    if (cleanFirstLine && cleanFirstLine.length > 2 && !cleanFirstLine.includes('.')) {
      return cleanFirstLine;
    }
  }

  // Pattern 4: Look for "Join" or "We're" phrases
  const joinMatch = text.match(/(?:join|we're|we are|at)\s+([A-Z][A-Za-z0-9\s&'()-]+)/i);
  if (joinMatch && joinMatch[1].trim().length > 1) {
    return joinMatch[1].trim();
  }

  return null;
}

export const useJobStore = create<JobState>()(
  persist(
    (set, get) => ({
      resumes: {},
      activeResumeId: null,
      formValues: getInitialFormState(),
      history: [],
      ui: {
        showResume: true,
        showJobDescription: true,
        showPreferences: true,
        expandedHistoryId: null,
      },
      jobStatus: {
        isPending: false,
        duration: null,
        result: null,
        errorMessage: null,
      },
      actions: {
        setFieldValue: (field, value) =>
          set((state) => ({
            formValues: { ...state.formValues, [field]: value },
          })),

        saveResume: (name, content) => {
          const id = crypto.randomUUID();
          set((state) => ({
            resumes: {
              ...state.resumes,
              [id]: { id, name, content, updatedAt: Date.now() },
            },
          }));
        },

        loadResume: (id) => {
          if (!id || id === "none") {
            set((_state) => ({
              activeResumeId: null,
            }));
            return;
          }
          const resume = get().resumes[id];
          if (resume) {
            set({
              activeResumeId: id,
              formValues: { ...get().formValues, resume: resume.content },
            });
          }
        },

        deleteResume: (id) =>
          set((state) => {
            const newResumes = { ...state.resumes };
            delete newResumes[id];
            return {
              resumes: newResumes,
              activeResumeId:
                state.activeResumeId === id ? null : state.activeResumeId,
            };
          }),

        startJob: () =>
          set({
            jobStatus: {
              isPending: true,
              duration: null,
              result: null,
              errorMessage: null,
            },
          }),

        endJob: (result, error, duration) => {
          // Auto-save to history on successful result
          if (result) {
            const { target_role, experience_level, tone, job_description, company_name: provided_company } = get().formValues;
            const company_name = provided_company || extractCompanyName(job_description || "");
            const historyId = crypto.randomUUID();
            set((state) => ({
              jobStatus: {
                isPending: false,
                duration,
                result,
                errorMessage: error,
              },
              history: [
                {
                  id: historyId,
                  createdAt: Date.now(),
                  target_role,
                  experience_level,
                  tone,
                  company_name,
                  result,
                },
                ...state.history,
              ],
            }));
          } else {
            set({
              jobStatus: {
                isPending: false,
                duration,
                result,
                errorMessage: error,
              },
            });
          }
        },

        setDuration: (duration) =>
          set((state) => ({
            jobStatus: { ...state.jobStatus, duration },
          })),

        toggleSection: (section) =>
          set((state) => ({
            ui: { ...state.ui, [section]: !state.ui[section] },
          })),

        closeAllSections: () =>
          set({
            ui: {
              showResume: false,
              showJobDescription: false,
              showPreferences: false,
              expandedHistoryId: null,
            },
          }),

        resetForm: () =>
          set({
            formValues: getInitialFormState(),
            activeResumeId: null,
          }),

        saveToHistory: (entry) => {
          const id = crypto.randomUUID();
          set((state) => ({
            history: [
              { ...entry, id, createdAt: Date.now() },
              ...state.history,
            ],
          }));
        },

        deleteFromHistory: (id) =>
          set((state) => ({
            history: state.history.filter((h) => h.id !== id),
          })),

        clearHistory: () => set({ history: [] }),

        toggleHistoryEntry: (id) =>
          set((state) => ({
            ui: {
              ...state.ui,
              expandedHistoryId:
                state.ui.expandedHistoryId === id ? null : id,
            },
          })),
      },
    }),
    {
      name: "job-agent-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        resumes: state.resumes,
        activeResumeId: state.activeResumeId,
        formValues: state.formValues,
        history: state.history,
      }),
    },
  ),
);
