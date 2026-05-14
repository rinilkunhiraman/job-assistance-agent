"use client";

import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  Target,
  TrendingUp,
  BookOpen,
  Zap,
  Briefcase,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useJobStore } from "@/store/useJobStore";

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
      onClick={(e) => {
        e.stopPropagation();
        handleCopy();
      }}
      className="h-8 w-8 transition-all"
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

function SkillBadge({
  name,
  type,
}: {
  name: string;
  type: "matched" | "missing";
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mr-1.5 mb-1.5 ${
        type === "matched"
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      {type === "matched" ? (
        <CheckCircle className="w-2.5 h-2.5 mr-1" />
      ) : (
        <XCircle className="w-2.5 h-2.5 mr-1" />
      )}
      {name}
    </span>
  );
}

export default function History() {
  const history = useJobStore((state) => state.history);
  const ui = useJobStore((state) => state.ui);
  const actions = useJobStore((state) => state.actions);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getRatingIcon = (rating: string) => {
    if (rating.includes("Strong"))
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (rating.includes("Moderate"))
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  if (history.length === 0) {
    return (
      <Card className="overflow-hidden rounded-2xl shadow-lg border-border/50">
        <CardContent className="p-6 text-center py-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg mb-2">No history yet</h3>
          <p className="text-sm text-muted-foreground">
            Your generated applications will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold font-heading">History</h2>
        <span className="text-sm text-muted-foreground">
          {history.length} {history.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      <div className="space-y-2">
        {history.map((entry) => (
          <Card
            key={entry.id}
            className="overflow-hidden rounded-xl border-border/50 shadow-sm"
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => actions.toggleHistoryEntry(entry.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  actions.toggleHistoryEntry(entry.id);
                }
              }}
              className="w-full p-4 text-left hover:bg-accent/30 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {ui.expandedHistoryId === entry.id ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="font-medium truncate">
                      {entry.target_role || "Untitled"}
                      {entry.company_name && (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          at {entry.company_name}
                        </span>
                      )}
                    </span>
                    {entry.fit_rating && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto flex items-center gap-1 ${
                          entry.fit_rating.includes("Strong")
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : entry.fit_rating.includes("Moderate")
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {getRatingIcon(entry.fit_rating)}
                        {entry.fit_rating.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                    <span className="px-2 py-0.5 bg-secondary rounded text-xs">
                      {entry.experience_level}
                    </span>
                    <span className="px-2 py-0.5 bg-secondary rounded text-xs">
                      {entry.tone}
                    </span>
                    <span className="text-xs">
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this history entry?")) {
                      actions.deleteFromHistory(entry.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {ui.expandedHistoryId === entry.id && (
              <div className="px-4 pb-4 pt-0 border-t border-border/50 animate-in slide-in-from-top-1 duration-200">
                <Tabs defaultValue="fit" className="mt-4">
                  <TabsList className="grid w-full grid-cols-6 h-8">
                    <TabsTrigger
                      value="fit"
                      className="text-[10px] uppercase font-bold"
                    >
                      Fit
                    </TabsTrigger>
                    <TabsTrigger
                      value="resume"
                      className="text-[10px] uppercase font-bold"
                    >
                      Resume
                    </TabsTrigger>
                    <TabsTrigger
                      value="outreach"
                      className="text-[10px] uppercase font-bold"
                    >
                      Outreach
                    </TabsTrigger>
                    <TabsTrigger
                      value="cover"
                      className="text-[10px] uppercase font-bold"
                    >
                      Cover
                    </TabsTrigger>
                    <TabsTrigger
                      value="gap"
                      className="text-[10px] uppercase font-bold"
                    >
                      Gap
                    </TabsTrigger>
                    <TabsTrigger
                      value="inputs"
                      className="text-[10px] uppercase font-bold"
                    >
                      Inputs
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="fit" className="space-y-4 pt-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                        {getRatingIcon(entry.result.fit.fit_rating)}
                        Fit Summary
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {entry.result.fit.summary}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5">
                          Matched Skills
                        </h5>
                        <div className="flex flex-wrap">
                          {entry.result.fit.matched_skills.map((skill) => (
                            <SkillBadge
                              key={`matched-${skill}`}
                              name={skill}
                              type="matched"
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5">
                          Missing Skills
                        </h5>
                        <div className="flex flex-wrap">
                          {entry.result.fit.missing_skills.map((skill) => (
                            <SkillBadge
                              key={`missing-${skill}`}
                              name={skill}
                              type="missing"
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {entry.result.fit.seniority_gap && (
                      <div className="p-2 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-yellow-700 dark:text-yellow-400">
                          <span className="font-bold">Seniority Note:</span>{" "}
                          {entry.result.fit.seniority_note}
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="resume" className="space-y-4 pt-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold uppercase text-muted-foreground">
                            Optimized Summary
                          </h4>
                          <CopyButton
                            text={entry.result.resume.professional_summary}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                          {entry.result.resume.professional_summary}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-2">
                          ATS Keywords
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.result.resume.ats_keywords.map((kw) => (
                            <span
                              key={`kw-${kw}`}
                              className="px-1.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded text-[10px] font-mono border border-blue-100 dark:border-blue-900/30"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3 pt-2 border-t">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground">
                          Experience Bullet Improvements
                        </h4>
                        {Object.entries(
                          entry.result.resume.experience_bullets,
                        ).map(([role, bullets]) => (
                          <div key={`role-${role}`} className="space-y-1.5">
                            <h5 className="text-[11px] font-semibold text-primary underline underline-offset-4 decoration-primary/20">
                              {role}
                            </h5>
                            <ul className="list-disc pl-4 space-y-1">
                              {bullets.map((bullet, j) => (
                                <li
                                  key={`bullet-${role}-${j}`}
                                  className="text-[11px] text-muted-foreground leading-snug"
                                >
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      {entry.result.resume.improvement_notes.length > 0 && (
                        <div className="mt-4 p-2 bg-muted/50 rounded-lg text-[10px] space-y-1 border border-dashed">
                          <p className="font-bold uppercase tracking-tight text-muted-foreground">
                            Strategic Recommendations
                          </p>
                          {entry.result.resume.improvement_notes.map((note) => (
                            <p
                              key={`note-${note.substring(0, 20)}`}
                              className="text-muted-foreground"
                            >
                              • {note}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="outreach" className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground">
                        Cold Outreach Message
                      </h4>
                      <CopyButton text={entry.result.outreach.message} />
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg border text-xs whitespace-pre-wrap font-mono leading-relaxed">
                      {entry.result.outreach.message}
                    </div>
                  </TabsContent>

                  <TabsContent value="cover" className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground">
                        Cover Letter
                      </h4>
                      <CopyButton
                        text={`${entry.result.cover_letter.salutation}\n\n${entry.result.cover_letter.opening_paragraph}\n\n${entry.result.cover_letter.body_paragraph_1}\n\n${entry.result.cover_letter.body_paragraph_2}\n\n${entry.result.cover_letter.closing_paragraph}\n\n${entry.result.cover_letter.sign_off}`}
                      />
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-4 text-xs whitespace-pre-wrap font-serif leading-relaxed max-h-[300px] overflow-y-auto">
                      <p className="mb-4">
                        {entry.result.cover_letter.salutation}
                      </p>
                      <p className="mb-4">
                        {entry.result.cover_letter.opening_paragraph}
                      </p>
                      <p className="mb-4">
                        {entry.result.cover_letter.body_paragraph_1}
                      </p>
                      <p className="mb-4">
                        {entry.result.cover_letter.body_paragraph_2}
                      </p>
                      <p className="mb-4">
                        {entry.result.cover_letter.closing_paragraph}
                      </p>
                      <p>{entry.result.cover_letter.sign_off}</p>
                    </div>
                  </TabsContent>

                    <TabsContent value="gap" className="space-y-4 pt-4">
                      {!entry.result.gap ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                          <p className="text-[10px] text-muted-foreground max-w-[150px]">
                            Gap analysis unavailable for this entry.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <p className="text-[11px] leading-relaxed italic text-muted-foreground">
                              &ldquo;{entry.result.gap.overall_verdict}&rdquo;
                            </p>
                          </div>

                          {entry.result.gap.seniority_advice && (
                            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-lg flex items-start gap-2">
                              <TrendingUp className="h-3.5 w-3.5 text-yellow-600 shrink-0 mt-0.5" />
                              <p className="text-[10px] text-yellow-700 dark:text-yellow-400">
                                <span className="font-bold">Advice:</span>{" "}
                                {entry.result.gap.seniority_advice}
                              </p>
                            </div>
                          )}

                          {entry.result.gap.career_gap_advice && (
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-lg flex items-start gap-2">
                              <Briefcase className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <p className="text-[10px] text-blue-700 dark:text-blue-400">
                                <span className="font-bold">Gap Strategy:</span>{" "}
                                {entry.result.gap.career_gap_advice}
                              </p>
                            </div>
                          )}

                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold uppercase text-muted-foreground">
                              Actionable Gaps
                            </h4>
                            <div className="grid gap-2">
                              {entry.result.gap.skill_gaps.map((gap, i) => (
                                <div
                                  key={`gap-item-${i}`}
                                  className="p-2 border rounded-lg bg-card/50 space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs">
                                      {gap.skill}
                                    </span>
                                    <span
                                      className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                                        gap.impact === "High"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-blue-100 text-blue-700"
                                      }`}
                                    >
                                      {gap.impact}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                                    <div className="flex items-center gap-1">
                                      <BookOpen className="w-2.5 h-2.5 text-muted-foreground" />
                                      {gap.resource_type}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Zap className="w-2.5 h-2.5 text-yellow-500" />
                                      {gap.concrete_action}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {entry.result.gap.quick_wins.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {entry.result.gap.quick_wins.map((win, i) => (
                                <span
                                  key={`win-${i}`}
                                  className="px-1.5 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-[9px] border border-green-100 dark:border-green-900/30"
                                >
                                  {win}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                  <TabsContent value="inputs" className="space-y-4 pt-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold uppercase text-muted-foreground">
                            Original Resume
                          </h4>
                          <CopyButton text={entry.resume} />
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 text-[10px] font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto border">
                          {entry.resume}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold uppercase text-muted-foreground">
                            Job Description
                          </h4>
                          <CopyButton text={entry.job_description} />
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 text-[10px] font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto border">
                          {entry.job_description}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
