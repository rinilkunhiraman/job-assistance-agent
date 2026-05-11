"use client";

import { Check, Copy, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Component, type ReactNode, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useJobStore } from "@/store/useJobStore";

class MarkdownErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: string | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Markdown rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-sm text-destructive">
          Unable to render content. Please try copying the raw text instead.
        </div>
      );
    }
    return this.props.children;
  }
}

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
      className="h-8 w-8 transition-all"
      title="Copy to clipboard"
      aria-label={copied ? "Copied" : "Copy to clipboard"}
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
  if (!content || typeof content !== "string") {
    return <p className="text-muted-foreground">No content available</p>;
  }

  return (
    <MarkdownErrorBoundary>
      <div className={markdownClasses}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </MarkdownErrorBoundary>
  );
}

function SkillBadge({ name, type }: { name: string; type: "matched" | "missing" }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 mb-2 ${
        type === "matched"
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      {type === "matched" ? (
        <Check className="w-3 h-3 mr-1" />
      ) : (
        <XCircle className="w-3 h-3 mr-1" />
      )}
      {name}
    </span>
  );
}

export default function JobResult() {
  const result = useJobStore((state) => state.jobStatus.result);

  if (!result) {
    return null;
  }

  const getRatingIcon = (rating: string) => {
    if (rating.includes("Strong")) return <CheckCircle className="w-6 h-6 text-green-500" />;
    if (rating.includes("Moderate")) return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    return <XCircle className="w-6 h-6 text-red-500" />;
  };

  const getRatingColor = (rating: string) => {
    if (rating.includes("Strong")) return "text-green-600 dark:text-green-400";
    if (rating.includes("Moderate")) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Tabs defaultValue="fit" className="mt-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="fit">Job Fit</TabsTrigger>
        <TabsTrigger value="resume">Resume</TabsTrigger>
        <TabsTrigger value="outreach">Outreach</TabsTrigger>
        <TabsTrigger value="cover">Cover Letter</TabsTrigger>
      </TabsList>

      <TabsContent value="fit">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-bold">Job Fit Check</CardTitle>
            <div className="flex items-center gap-2">
              {getRatingIcon(result.fit.fit_rating)}
              <span className={`font-bold ${getRatingColor(result.fit.fit_rating)}`}>
                {result.fit.fit_rating}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-3 bg-muted/50 rounded-lg border italic text-sm">
              &ldquo;{result.fit.fit_justification}&rdquo;
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Analysis Summary</h4>
              <div className="text-sm leading-relaxed">
                <MarkdownView content={result.fit.summary} />
              </div>
            </div>

            {result.fit.seniority_gap && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-bold text-yellow-800 dark:text-yellow-400">Seniority Alignment Note:</span>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-0.5">{result.fit.seniority_note}</p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Matched Skills
                </h4>
                <div className="flex flex-wrap">
                  {result.fit.matched_skills.map((skill, i) => (
                    <SkillBadge key={i} name={skill} type="matched" />
                  ))}
                  {result.fit.matched_skills.length === 0 && <p className="text-sm text-muted-foreground italic">No clear matches found.</p>}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  Missing Skills
                </h4>
                <div className="flex flex-wrap">
                  {result.fit.missing_skills.map((skill, i) => (
                    <SkillBadge key={i} name={skill} type="missing" />
                  ))}
                  {result.fit.missing_skills.length === 0 && <p className="text-sm text-muted-foreground italic">No significant gaps identified.</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="resume">
        <Card className="relative">
          <div className="absolute top-4 right-4 z-10">
            <CopyButton text={JSON.stringify(result.resume, null, 2)} />
          </div>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <h4 className="font-bold text-lg">Optimized Summary</h4>
              <p className="text-sm leading-relaxed">{result.resume.professional_summary}</p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-bold text-lg">ATS Keywords to Include</h4>
              <div className="flex flex-wrap gap-2">
                {result.resume.ats_keywords.map((kw, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-mono">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-bold text-lg">Experience Bullet Improvements</h4>
              {Object.entries(result.resume.experience_bullets).map(([role, bullets], i) => (
                <div key={i} className="space-y-2">
                  <h5 className="font-semibold text-sm text-muted-foreground underline decoration-primary/30 underline-offset-4">{role}</h5>
                  <ul className="list-disc pl-5 space-y-1">
                    {bullets.map((bullet, j) => (
                      <li key={j} className="text-sm">{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {result.resume.improvement_notes.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-xs space-y-1">
                <p className="font-bold uppercase tracking-tighter text-[10px] text-muted-foreground">Improvement Notes</p>
                {result.resume.improvement_notes.map((note, i) => <p key={i}>• {note}</p>)}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="outreach">
        <Card className="relative">
          <div className="absolute top-4 right-4 z-10">
            <CopyButton text={result.outreach.message} />
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-lg">Cold Outreach Message</h4>
              {result.outreach.company_name && (
                <span className="text-xs px-2 py-1 bg-muted rounded font-medium">Target: {result.outreach.company_name}</span>
              )}
            </div>
            <div className="p-4 bg-muted/30 rounded-lg border whitespace-pre-wrap text-sm leading-relaxed font-serif italic">
              {result.outreach.message}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase">Hook Strategy</p>
              <div className="flex gap-2">
                {result.outreach.hook_skills.map((skill, i) => (
                  <span key={i} className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded text-[10px] font-bold">
                    {skill.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cover">
        <Card className="relative">
          <div className="absolute top-4 right-4 z-10">
            <CopyButton text={`${result.cover_letter.salutation}\n\n${result.cover_letter.opening_paragraph}\n\n${result.cover_letter.body_paragraph_1}\n\n${result.cover_letter.body_paragraph_2}\n\n${result.cover_letter.closing_paragraph}\n\n${result.cover_letter.sign_off}`} />
          </div>
          <CardContent className="p-8 space-y-6 font-serif max-w-2xl mx-auto">
            <div className="space-y-1 text-right text-sm text-muted-foreground italic">
              Word Count: {result.cover_letter.word_count}
            </div>
            
            <p>{result.cover_letter.salutation}</p>
            
            <p className="leading-relaxed">{result.cover_letter.opening_paragraph}</p>
            
            <p className="leading-relaxed">{result.cover_letter.body_paragraph_1}</p>
            
            <p className="leading-relaxed">{result.cover_letter.body_paragraph_2}</p>
            
            <p className="leading-relaxed">{result.cover_letter.closing_paragraph}</p>
            
            <div className="pt-4">
              <p>{result.cover_letter.sign_off}</p>
              <p className="font-bold mt-1 text-lg">[Your Name]</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
