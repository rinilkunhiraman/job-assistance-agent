"use client";

import { useState } from "react";
import JobForm from "@/components/job/JobForm";
import JobResult from "@/components/job/JobResult";

export default function Home() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runPipeline = async (form: any) => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ fit_summary: "Error connecting to backend" });
    }

    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">
        AI Job Copilot 🚀
      </h1>

      <JobForm onSubmit={runPipeline} />

      {loading && <p>Generating results...</p>}

      <JobResult data={result} />
    </div>
  );
}