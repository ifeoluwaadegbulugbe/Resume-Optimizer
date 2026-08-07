"use client";

import { useRef, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { randomUUID } from "@/lib/utils/uuid";
import { toast } from "sonner";
import type { ResumeData, JobDescriptionAnalysis, ChatMessage } from "@/types/resume";

const SUGGESTIONS = [
  "Make the summary punchier",
  "Emphasize leadership more",
  "Tighten the second bullet under my most recent role",
  "Why is my recruiter score capped?",
];

export function ResumeChat({
  originalResumeData,
  currentResumeData,
  jd,
  messages,
  onMessagesChange,
  onResumeChange,
}: {
  originalResumeData: ResumeData;
  currentResumeData: ResumeData;
  jd: JobDescriptionAnalysis | null;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  onResumeChange: (next: ResumeData) => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading || !jd) return;
    const userMsg: ChatMessage = { id: randomUUID(), role: "user", content: text.trim(), createdAt: new Date().toISOString() };
    const nextMessages = [...messages, userMsg];
    onMessagesChange(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/optimize/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalResumeData,
          currentResumeData,
          jd,
          history: messages,
          userMessage: text.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat request failed.");

      const assistantMsg: ChatMessage = {
        id: randomUUID(),
        role: "assistant",
        content: data.madeChanges && data.changesSummary?.length
          ? `${data.reply}\n\nChanges made:\n${data.changesSummary.map((c: string) => `• ${c}`).join("\n")}`
          : data.reply,
        createdAt: new Date().toISOString(),
      };
      onMessagesChange([...nextMessages, assistantMsg]);
      if (data.madeChanges) {
        onResumeChange(data.resumeData);
        toast.success("Resume updated.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chat request failed.";
      toast.error(message);
      onMessagesChange([
        ...nextMessages,
        { id: randomUUID(), role: "assistant", content: `Something went wrong: ${message}`, createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex h-[600px] flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ask for adjustments in plain language. Edits stay truthful to your original resume — if you ask
              for something unverified, I&apos;ll explain why I won&apos;t add it instead.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                m.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
              )}
            >
              {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            </div>
            <div
              className={cn(
                "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
                m.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-muted text-foreground"
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </div>
        )}
      </div>

      <div className="flex items-end gap-2 border-t border-border p-3">
        <Textarea
          rows={1}
          value={input}
          placeholder={jd ? "Ask for an adjustment…" : "Job description unavailable for this version"}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          disabled={!jd || loading}
          className="min-h-9 flex-1 resize-none"
        />
        <Button size="icon" onClick={() => send(input)} disabled={!jd || loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {messages.length > 0 && (
        <div className="border-t border-border px-3 py-1.5">
          <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
            Edits are re-scored the next time you open Score Breakdown — click Rescore there if you want fresh
            numbers immediately.
          </Badge>
        </div>
      )}
    </Card>
  );
}
