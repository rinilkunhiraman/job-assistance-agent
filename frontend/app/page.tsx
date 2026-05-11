"use client";

import { useEffect, useRef, useState } from "react";

import History from "@/components/job/History";
import JobForm from "@/components/job/JobForm";
import JobResult from "@/components/job/JobResult";
import { runJobPipelineStream } from "@/lib/api";
import type { JobRequest } from "@/lib/job";
import { useJobStore } from "@/store/useJobStore";

type Tab = "new" | "history";

export default function Home() {
  const { jobStatus, actions, history } = useJobStore();
  const { isPending, duration, errorMessage, progressMessage } = jobStatus;
  const startTimeRef = useRef<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("new");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPending) {
      startTimeRef.current = Date.now();
      interval = setInterval(() => {
        if (startTimeRef.current) {
          actions.setDuration(Date.now() - startTimeRef.current);
        }
      }, 100);
    } else {
      startTimeRef.current = null;
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPending, actions]);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const runPipeline = async (payload: JobRequest) => {
    actions.startJob();

    await runJobPipelineStream(payload, {
        onProgress: (message) => {
            actions.updateProgress(message);
        },
        onError: (error) => {
            const finalDuration = startTimeRef.current
                ? Date.now() - startTimeRef.current
                : 0;
            actions.endJob(null, error, finalDuration);
        },
        onSuccess: (data) => {
            const finalDuration = startTimeRef.current
                ? Date.now() - startTimeRef.current
                : 0;
            actions.endJob(data, null, finalDuration);
        }
    });
  };

  return (
    <div className="min-h-screen bg-atmosphere py-12 px-4">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="animate-in">
          <span className="inline-block px-3 py-1 text-xs font-medium tracking-wide uppercase bg-primary/5 text-primary rounded-full mb-3">
            AI-Powered
          </span>
          <h1 className="text-4xl font-bold tracking-tight">Job Application Agent</h1>
        </div>

        <div className="animate-in delay-100">
          <div className="flex gap-1 p-1 bg-muted/50 rounded-lg mb-4 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("new")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "new"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              New Application
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                activeTab === "history"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              History
              {history.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                  {history.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === "new" ? (
            <JobForm
              onSubmit={runPipeline}
              onError={setFormError}
              disabled={isPending}
            />
          ) : (
            <History />
          )}
        </div>

        {activeTab === "new" && (
        <div className="animate-in delay-200 space-y-4">
          {(errorMessage || formError) && (
            <div
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {errorMessage || formError}
            </div>
          )}

          {isPending && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-2xl border border-dashed animate-pulse">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-primary">
                  {progressMessage || "Generating application materials..."}
                </p>
                {duration && (
                    <span className="text-xs font-mono text-muted-foreground">
                        {formatDuration(duration)}
                    </span>
                )}
              </div>
              
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full animate-progress-indeterminate" />
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { key: "fit", label: "Fit Analysis", done: progressMessage?.includes("Fit analysis complete") || progressMessage?.includes("Optimizing") || progressMessage?.includes("Resume") || progressMessage?.includes("Outreach") || progressMessage?.includes("Cover") },
                  { key: "resume", label: "Resume Optimization", done: progressMessage?.includes("Resume optimization complete") },
                  { key: "outreach", label: "Outreach Message", done: progressMessage?.includes("Outreach message complete") },
                  { key: "cover", label: "Cover Letter", done: progressMessage?.includes("Cover letter complete") },
                ].map((task) => (
                  <span
                    key={task.key}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition-colors ${
                      task.done 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${task.done ? "bg-green-500" : "bg-amber-500 animate-pulse"}`} />
                    {task.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!isPending && duration && (
            <output className="block text-sm text-muted-foreground text-center">
              Completed in {formatDuration(duration)}
            </output>
          )}

          <JobResult />
        </div>
        )}
      </div>
    </div>
  );
}
