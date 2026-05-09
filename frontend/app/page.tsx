"use client";

import { useEffect, useRef, useState } from "react";

import History from "@/components/job/History";
import JobForm from "@/components/job/JobForm";
import JobResult from "@/components/job/JobResult";
import { ApiError, runJobPipeline } from "@/lib/api";
import type { JobRequest } from "@/lib/job";
import { useJobStore } from "@/store/useJobStore";

type Tab = "new" | "history";

export default function Home() {
  const { jobStatus, actions, history } = useJobStore();
  const { isPending, duration, errorMessage } = jobStatus;
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

    try {
      const data = await runJobPipeline(payload);
      const finalDuration = startTimeRef.current
        ? Date.now() - startTimeRef.current
        : 0;
      actions.endJob(data, null, finalDuration);
    } catch (error) {
      const errorMsg =
        error instanceof ApiError
          ? error.message
          : "Unable to connect to the backend. Check that the API is running.";
      const finalDuration = startTimeRef.current
        ? Date.now() - startTimeRef.current
        : 0;
      actions.endJob(null, errorMsg, finalDuration);
    }
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
            <div className="space-y-2">
              <p className="text-sm text-amber-600 font-medium">
                Generating application materials...
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "fit", label: "Fit Analysis" },
                  { key: "resume", label: "Resume Optimization" },
                  { key: "outreach", label: "Outreach Message" },
                  { key: "cover", label: "Cover Letter" },
                ].map((task) => (
                  <span
                    key={task.key}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-secondary rounded-full text-muted-foreground"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    {task.label}
                  </span>
                ))}
              </div>
              {duration && (
                <p className="text-xs text-muted-foreground">
                  {formatDuration(duration)}
                </p>
              )}
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
