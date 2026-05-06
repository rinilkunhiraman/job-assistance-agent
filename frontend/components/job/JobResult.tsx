"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { JobResponse } from "@/lib/job";

type JobResultProps = {
  data: JobResponse | null;
};

export default function JobResult({ data }: JobResultProps) {
  if (!data) {
    return null;
  }

  return (
    <Tabs defaultValue="fit" className="mt-6">
      <TabsList>
        <TabsTrigger value="fit">Fit</TabsTrigger>
        <TabsTrigger value="resume">Resume</TabsTrigger>
        <TabsTrigger value="outreach">Outreach</TabsTrigger>
        <TabsTrigger value="cover">Cover Letter</TabsTrigger>
      </TabsList>

      <TabsContent value="fit">
        <Card>
          <CardContent className="space-y-4 p-4 whitespace-pre-wrap">
            <div>{data.fit_summary}</div>
            {(data.keywords.matched.length > 0 ||
              data.keywords.missing.length > 0) && (
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Matched keywords:</span>{" "}
                  {data.keywords.matched.join(", ") || "None"}
                </div>
                <div>
                  <span className="font-semibold">Missing keywords:</span>{" "}
                  {data.keywords.missing.join(", ") || "None"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="resume">
        <Card>
          <CardContent className="p-4 whitespace-pre-wrap">
            {data.resume_improvements}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="outreach">
        <Card>
          <CardContent className="p-4 whitespace-pre-wrap">
            {data.outreach_message}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cover">
        <Card>
          <CardContent className="p-4 whitespace-pre-wrap">
            {data.cover_letter}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
