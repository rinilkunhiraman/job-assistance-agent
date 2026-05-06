"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function JobForm({ onSubmit }: any) {
  const [form, setForm] = useState({
    resume: "",
    job_description: "",
    target_role: "",
    experience_level: "",
    tone: "",
    achievements: ""
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <Textarea
          name="resume"
          placeholder="Paste your resume..."
          onChange={handleChange}
        />

        <Textarea
          name="job_description"
          placeholder="Paste job description..."
          onChange={handleChange}
        />

        <Input
          name="target_role"
          placeholder="Target role"
          onChange={handleChange}
        />

        <Input
          name="experience_level"
          placeholder="Experience level (Entry/Mid/Senior)"
          onChange={handleChange}
        />

        <Input
          name="tone"
          placeholder="Tone (Professional/Friendly)"
          onChange={handleChange}
        />

        <Textarea
          name="achievements"
          placeholder="Key achievements (optional)"
          onChange={handleChange}
        />

        <Button onClick={() => onSubmit(form)}>
          Generate
        </Button>
      </CardContent>
    </Card>
  );
}