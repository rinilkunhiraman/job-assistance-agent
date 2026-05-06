"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export default function JobResult({ data }: any) {
  if (!data) return null;

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
          <CardContent className="p-4 whitespace-pre-wrap">
            {data.fit_summary}
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