"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { JobResponse } from "@/lib/job";

type JobResultProps = {
  data: JobResponse | null;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="absolute top-2 right-2 h-8 w-8 transition-all"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
      )}
    </Button>
  );
}

const markdownClasses =
  "max-w-none space-y-4 [&>h1]:text-2xl [&>h1]:font-bold [&>h2]:text-xl [&>h2]:font-bold [&>h3]:text-lg [&>h3]:font-bold [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>p]:leading-relaxed [&>li]:mt-1";

function MarkdownView({ content }: { content: string }) {
  return (
    <div className={markdownClasses}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

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
        <Card className="relative">
          <CopyButton text={data.fit_summary} />
          <CardContent className="space-y-4 p-4 pt-10 sm:pt-4 sm:pr-12">
            <MarkdownView content={data.fit_summary} />
            {(data.keywords.matched.length > 0 ||
              data.keywords.missing.length > 0) && (
              <div className="space-y-2 mt-6 pt-4 border-t">
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
        <Card className="relative">
          <CopyButton text={data.resume_improvements} />
          <CardContent className="p-4 pt-10 sm:pt-4 sm:pr-12">
            <MarkdownView content={data.resume_improvements} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="outreach">
        <Card className="relative">
          <CopyButton text={data.outreach_message} />
          <CardContent className="p-4 pt-10 sm:pt-4 sm:pr-12">
            <MarkdownView content={data.outreach_message} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cover">
        <Card className="relative">
          <CopyButton text={data.cover_letter} />
          <CardContent className="p-4 pt-10 sm:pt-4 sm:pr-12">
            <MarkdownView content={data.cover_letter} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
