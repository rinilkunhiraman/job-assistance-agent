import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { FormState, JobResponse } from '@/lib/job';
import { getInitialFormState } from '@/lib/job';

interface Resume {
  id: string;
  name: string;
  content: string;
  updatedAt: number;
}

interface JobUIState {
  showResume: boolean;
  showJobDescription: boolean;
  showPreferences: boolean;
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

  // UI State
  ui: JobUIState;

  // Lifecycle
  jobStatus: JobStatus;

  // Actions
  actions: {
    setFieldValue: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
    saveResume: (name: string, content: string) => void;
    loadResume: (id: string) => void;
    deleteResume: (id: string) => void;
    startJob: () => void;
    endJob: (result: JobResponse | null, error: string | null, duration: number | null) => void;
    setDuration: (duration: number) => void;
    toggleSection: (section: keyof JobUIState) => void;
    closeAllSections: () => void;
    resetForm: () => void;
  };
}

export const useJobStore = create<JobState>()(
  persist(
    (set, get) => ({
      resumes: {},
      activeResumeId: null,
      formValues: getInitialFormState(),
      ui: {
        showResume: true,
        showJobDescription: true,
        showPreferences: true,
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
            formValues: { ...state.formValues, [field]: value }
          })),

        saveResume: (name, content) => {
          const id = crypto.randomUUID();
          set((state) => ({
            resumes: {
              ...state.resumes,
              [id]: { id, name, content, updatedAt: Date.now() }
            }
          }));
        },

        loadResume: (id) => {
          if (!id || id === "none") {
            set((state) => ({
              activeResumeId: null,
            }));
            return;
          }
          const resume = get().resumes[id];
          if (resume) {
            set({
              activeResumeId: id,
              formValues: { ...get().formValues, resume: resume.content }
            });
          }
        },

        deleteResume: (id) =>
          set((state) => {
            const newResumes = { ...state.resumes };
            delete newResumes[id];
            return {
              resumes: newResumes,
              activeResumeId: state.activeResumeId === id ? null : state.activeResumeId
            };
          }),

        startJob: () =>
          set({
            jobStatus: {
              isPending: true,
              duration: null,
              result: null,
              errorMessage: null,
            }
          }),

        endJob: (result, error, duration) =>
          set({
            jobStatus: {
              isPending: false,
              duration,
              result,
              errorMessage: error,
            }
          }),

        setDuration: (duration) =>
          set((state) => ({
            jobStatus: { ...state.jobStatus, duration }
          })),

        toggleSection: (section) =>
          set((state) => ({
            ui: { ...state.ui, [section]: !state.ui[section] }
          })),

        closeAllSections: () =>
          set({
            ui: {
              showResume: false,
              showJobDescription: false,
              showPreferences: false,
            }
          }),

        resetForm: () =>
          set({
            formValues: getInitialFormState(),
            activeResumeId: null,
          }),
      },
    }),
    {
      name: 'job-agent-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        resumes: state.resumes,
        activeResumeId: state.activeResumeId,
        formValues: state.formValues,
      }),
    }
  )
);
