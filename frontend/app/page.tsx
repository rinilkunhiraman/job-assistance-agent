"use client";

import { useEffect, useRef, useState } from "react";

import JobForm from "@/components/job/JobForm";
import JobResult from "@/components/job/JobResult";
import { ApiError, runJobPipeline } from "@/lib/api";
import { useJobStore } from "@/store/useJobStore";

export default function Home() {
  const { jobStatus, actions } = useJobStore();
  const { isPending, duration, result, errorMessage } = jobStatus;
  const startTimeRef = useRef<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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

  const runPipeline = async (payload: any) => {
    actions.startJob();

    try {
      const data = await runJobPipeline(payload);
      const finalDuration = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      actions.endJob(data, null, finalDuration);
    } catch (error) {
      const errorMsg = error instanceof ApiError
        ? error.message
        : "Unable to connect to the backend. Check that the API is running.";
      const finalDuration = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      actions.endJob(null, errorMsg, finalDuration);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-3xl font-bold">AI Job Application Agent 🚀</h1>

      <JobForm
        onSubmit={runPipeline}
        onError={setFormError}
        disabled={isPending}
      />

      {(errorMessage || formError) && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage || formError}
        </div>
      )}

      {isPending && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Generating tailored application materials... {duration ? `(${formatDuration(duration)})` : ""}
        </p>
      )}

      {!isPending && duration && (
        <p className="text-sm text-muted-foreground text-center" role="status">
          Completed in {formatDuration(duration)}
        </p>
      )}

      <JobResult />
    </div>
  );
}
