"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Save,
  Settings,
  Trash2,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  EXPERIENCE_LEVELS,
  type FormState,
  getInitialFormState,
  jobFormSchema,
  TONES,
  toJobRequest,
} from "@/lib/job";
import { useJobStore } from "@/store/useJobStore";

type JobFormProps = {
  disabled?: boolean;
  onError: (message: string | null) => void;
  onSubmit: (payload: ReturnType<typeof toJobRequest>) => Promise<void>;
};

const fieldClassName = "min-h-11 rounded-xl px-3 text-sm sm:text-base";

export default function JobForm({
  disabled = false,
  onError,
  onSubmit,
}: JobFormProps) {
  const formValues = useJobStore((state) => state.formValues);
  const ui = useJobStore((state) => state.ui);
  const resumes = useJobStore((state) => state.resumes);
  const activeResumeId = useJobStore((state) => state.activeResumeId);
  const actions = useJobStore((state) => state.actions);

  const {
    register,
    handleSubmit: rhSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormState>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: formValues,
  });

  // Sync react-hook-form with Zustand store
  useEffect(() => {
    const subscription = watch((value) => {
      Object.entries(value).forEach(([field, val]) => {
        actions.setFieldValue(field as keyof FormState, val as any);
      });
    });
    return () => subscription.unsubscribe();
  }, [watch, actions.setFieldValue]);

  useEffect(() => {
    if (activeResumeId) {
      const resume = resumes[activeResumeId];
      if (resume) {
        setValue("resume", resume.content);
      }
    }
  }, [activeResumeId, resumes, setValue]);

  const formValuesWatch = watch();

  const handleSaveResume = () => {
    const name = prompt("Enter a name for this resume template:");
    if (name) {
      actions.saveResume(name, formValuesWatch.resume);
    }
  };

  const handleResetForm = () => {
    if (confirm("Are you sure you want to clear all fields?")) {
      actions.resetForm();
      // Reset react-hook-form state to initial values
      Object.entries(getInitialFormState()).forEach(([field, value]) => {
        setValue(field as any, value);
      });
    }
  };

  const onSubmitHandler = async (data: FormState) => {
    if (onError) onError(null);
    actions.closeAllSections();
    await onSubmit(toJobRequest(data));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await rhSubmit(onSubmitHandler)();

    if (Object.keys(errors).length > 0) {
      const firstError =
        Object.values(errors)[0]?.message ||
        "Please check the form for errors.";
      onError(firstError as string);
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl shadow-lg border-border/50">
      <CardContent className="p-4 sm:p-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold font-heading">Application Inputs</h2>
            <p className="text-sm text-muted-foreground">
              Paste the full resume and full job description, then choose the
              tone you want the AI to use.
            </p>
          </div>

          <div className="space-y-2 pt-2 first:pt-0">
            <button
              type="button"
              onClick={() => actions.toggleSection("showResume")}
              className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent/50 transition-colors"
            >
              {ui.showResume ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Resume
            </button>
            {ui.showResume && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {activeResumeId
                      ? `Loaded: ${Object.values(resumes).find((r) => r.id === activeResumeId)?.name}`
                      : "No template loaded"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={activeResumeId || ""}
                      onValueChange={(id) => {
                        if (id === "none") {
                          actions.loadResume(""); // Using a value that doesn't exist to clear
                          setValue("resume", "");
                        } else {
                          actions.loadResume(id);
                        }
                      }}
                    >
                      <SelectTrigger className="h-7 w-fit text-xs">
                        <SelectValue placeholder="Select a Resume..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None / Clear</SelectItem>
                        {Object.values(resumes).map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleSaveResume}
                      disabled={!formValuesWatch.resume || disabled}
                      title="Save as template"
                      aria-label="Save current resume as template"
                    >
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          disabled={disabled}
                          title="Manage Resumes"
                          aria-label="Manage saved resume templates"
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 max-h-60 overflow-y-auto">
                        <div className="space-y-2">
                          <h3 className="text-xs font-semibold text-muted-foreground mb-2">
                            Saved Resumes
                          </h3>
                          {Object.values(resumes).length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">
                              No resumes saved yet.
                            </p>
                          ) : (
                            Object.values(resumes).map((r) => (
                              <div
                                key={r.id}
                                className="group flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors"
                              >
                                <span className="text-xs truncate pr-2">
                                  {r.name}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => actions.deleteResume(r.id)}
                                  title="Delete resume"
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <Textarea
                  id="resume"
                  {...register("resume")}
                  placeholder="Paste the full resume here..."
                  disabled={disabled}
                  className={`min-h-36 resize-y rounded-xl px-3 py-3 text-sm sm:text-base ${
                    errors.resume ? "border-destructive" : ""
                  }`}
                />
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 first:pt-0">
            <button
              type="button"
              onClick={() => actions.toggleSection("showJobDescription")}
              className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent/50 transition-colors"
            >
              {ui.showJobDescription ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Job description
            </button>
            {ui.showJobDescription && (
              <Textarea
                id="job_description"
                {...register("job_description")}
                placeholder="Paste the full job description here..."
                disabled={disabled}
                className={`min-h-36 resize-y rounded-xl px-3 py-3 text-sm sm:text-base ${
                  errors.job_description ? "border-destructive" : ""
                }`}
              />
            )}
          </div>

          <div className="space-y-2 pt-2 first:pt-0">
            <button
              type="button"
              onClick={() => actions.toggleSection("showPreferences")}
              className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent/50 transition-colors"
            >
              {ui.showPreferences ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Preferences
            </button>
            {ui.showPreferences && (
              <div className="space-y-4">
                <label htmlFor="target_role" className="block space-y-2">
                  <span className="text-sm font-medium">Target role</span>
                  <Input
                    id="target_role"
                    {...register("target_role")}
                    placeholder="Target role"
                    disabled={disabled}
                    className={` ${fieldClassName} ${
                      errors.target_role ? "border-destructive" : ""
                    }`}
                  />
                </label>

                <label htmlFor="company_name" className="block space-y-2">
                  <span className="text-sm font-medium">
                    Company name
                    <span className="ml-1 text-muted-foreground">
                      (optional)
                    </span>
                  </span>
                  <Input
                    id="company_name"
                    {...register("company_name")}
                    placeholder="e.g. Google, Acme Inc."
                    disabled={disabled}
                    className={` ${fieldClassName} ${
                      errors.company_name ? "border-destructive" : ""
                    }`}
                  />
                </label>

                <label htmlFor="experience_level" className="block space-y-2">
                  <span className="text-sm font-medium">Experience level</span>
                  <Select
                    value={formValuesWatch.experience_level}
                    onValueChange={(value) =>
                      setValue("experience_level", value as any)
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger id="experience_level">
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.experience_level && (
                    <p className="text-xs text-destructive">
                      {errors.experience_level.message}
                    </p>
                  )}
                </label>

                <label htmlFor="tone" className="block space-y-2">
                  <span className="text-sm font-medium">Tone</span>
                  <Select
                    value={formValuesWatch.tone}
                    onValueChange={(value) => setValue("tone", value as any)}
                    disabled={disabled}
                  >
                    <SelectTrigger id="tone">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((tone) => (
                        <SelectItem key={tone} value={tone}>
                          {tone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tone && (
                    <p className="text-xs text-destructive">
                      {errors.tone.message}
                    </p>
                  )}
                </label>

                <label htmlFor="achievements" className="block space-y-2">
                  <span className="text-sm font-medium">
                    Key achievements
                    <span className="ml-1 text-muted-foreground">
                      (optional)
                    </span>
                  </span>
                  <Textarea
                    id="achievements"
                    {...register("achievements")}
                    placeholder="Key achievements, metrics, or wins you want emphasized"
                    disabled={disabled}
                    className={`min-h-28 resize-y rounded-xl px-3 py-3 text-sm sm:text-base ${
                      errors.achievements ? "border-destructive" : ""
                    }`}
                  />
                  {errors.achievements && (
                    <p className="text-xs text-destructive">
                      {errors.achievements.message}
                    </p>
                  )}
                </label>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="submit"
              disabled={disabled}
              className="min-h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {disabled ? "Generating..." : "Generate"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetForm}
              disabled={disabled}
              className="min-h-11 border-dashed"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
