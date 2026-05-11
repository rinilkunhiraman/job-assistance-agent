"use client";

import { ChevronDown, ChevronRight, Trash2, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useJobStore } from "@/store/useJobStore";

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
            <button
              type="button"
              onClick={() => actions.toggleHistoryEntry(entry.id)}
              className="w-full p-4 text-left hover:bg-accent/30 transition-colors"
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
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                    <span className="px-2 py-0.5 bg-secondary rounded text-xs">
                      {entry.experience_level}
                    </span>
                    <span className="px-2 py-0.5 bg-secondary rounded text-xs">
                      {entry.tone}
                    </span>
                    <span className="text-xs">{formatDate(entry.createdAt)}</span>
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
            </button>

            {ui.expandedHistoryId === entry.id && (
              <div className="px-4 pb-4 pt-0 border-t border-border/50 animate-in">
                <div className="space-y-4 pt-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Fit Summary ({entry.result.fit.fit_rating})</h4>
                    <p className="text-sm text-muted-foreground">
                      {entry.result.fit.summary}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-1">
                      Resume Summary
                    </h4>
                    <p className="text-sm text-muted-foreground italic">
                      {entry.result.resume.professional_summary}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-1">Outreach Message</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono text-xs">
                      {entry.result.outreach.message}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-1">Cover Letter</h4>
                    <div className="bg-secondary/50 rounded-lg p-3 text-sm whitespace-pre-wrap font-serif">
                      {entry.result.cover_letter.opening_paragraph.substring(0, 150)}...
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}