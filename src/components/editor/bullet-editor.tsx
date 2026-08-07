"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  LockOpen,
  Sparkles,
  Trash2,
  Undo2,
  Loader2,
  Check,
} from "lucide-react";
import type { ExperienceBullet, JobDescriptionAnalysis } from "@/types/resume";
import type { BulletAlternative } from "@/lib/ai/stages/regenerateBullet";
import { cn } from "@/lib/utils";

export function BulletEditor({
  bullet,
  roleContext,
  jd,
  onChange,
  onRemove,
  disabled,
}: {
  bullet: ExperienceBullet;
  roleContext: string;
  jd: JobDescriptionAnalysis | null;
  onChange: (next: ExperienceBullet) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bullet.text);
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState<BulletAlternative[] | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const locked = bullet.isLocked || disabled;

  async function regenerate() {
    if (!jd) return;
    setLoading(true);
    setAlternatives(null);
    try {
      const res = await fetch("/api/optimize/regenerate-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalBullet: bullet.originalText,
          currentBullet: bullet.text,
          roleContext,
          jd,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAlternatives(data.alternatives);
    } catch {
      setAlternatives(null);
    } finally {
      setLoading(false);
    }
  }

  function accept(text: string) {
    onChange({ ...bullet, text, isEdited: text !== bullet.originalText });
    setPopoverOpen(false);
    setAlternatives(null);
  }

  return (
    <div className={cn("group flex items-start gap-2 rounded-md px-1.5 py-1", locked && "opacity-70")}>
      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/60" />
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              className="text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onChange({ ...bullet, text: draft, isEdited: draft !== bullet.originalText });
                  setEditing(false);
                }}
              >
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setDraft(bullet.text); setEditing(false); }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p
            className="cursor-text text-sm leading-relaxed"
            onClick={() => !locked && setEditing(true)}
          >
            {bullet.text}
            {bullet.isEdited && (
              <Badge variant="outline" className="ml-2 align-middle text-[10px]">
                edited
              </Badge>
            )}
          </p>
        )}
      </div>

      {!editing && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Popover open={popoverOpen} onOpenChange={(open) => { setPopoverOpen(open); if (open) regenerate(); }}>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7" disabled={locked || !jd} title="Regenerate">
                <Sparkles className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 space-y-2" align="end">
              <p className="text-xs font-medium text-muted-foreground">Alternatives</p>
              {loading && (
                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating alternatives…
                </div>
              )}
              {!loading &&
                alternatives?.map((alt, i) => (
                  <div key={i} className="rounded-md border border-border p-2.5">
                    <Badge variant="secondary" className="mb-1.5 capitalize">
                      {alt.focus}-focused
                    </Badge>
                    <p className="text-sm">{alt.text}</p>
                    <div className="mt-2 flex justify-end gap-1.5">
                      <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => accept(alt.text)}>
                        <Check className="h-3 w-3" /> Accept
                      </Button>
                    </div>
                  </div>
                ))}
              {!loading && !alternatives && (
                <Button size="sm" variant="outline" onClick={regenerate} className="w-full">
                  Generate 3 alternatives
                </Button>
              )}
            </PopoverContent>
          </Popover>

          {bullet.isEdited && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              title="Undo to original"
              onClick={() => onChange({ ...bullet, text: bullet.originalText, isEdited: false })}
            >
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            title={bullet.isLocked ? "Unlock" : "Lock"}
            onClick={() => onChange({ ...bullet, isLocked: !bullet.isLocked })}
          >
            {bullet.isLocked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
          </Button>

          <Button size="icon" variant="ghost" className="h-7 w-7" title="Remove" onClick={onRemove} disabled={locked}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
