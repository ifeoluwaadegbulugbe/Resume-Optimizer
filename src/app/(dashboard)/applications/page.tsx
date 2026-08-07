"use client";

import { useState } from "react";
import Link from "next/link";
import { useDataStore } from "@/lib/data/store";
import { useHydrated } from "@/lib/data/use-hydrated";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import type { ApplicationStatus } from "@/types/resume";
import { format } from "date-fns";

const STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "final_round", label: "Final Round" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_VARIANT: Record<ApplicationStatus, string> = {
  saved: "bg-muted text-muted-foreground",
  applied: "bg-secondary text-secondary-foreground",
  screening: "bg-blue-100 text-blue-800",
  interview: "bg-amber-100 text-amber-800",
  final_round: "bg-purple-100 text-purple-800",
  offer: "bg-primary text-primary-foreground",
  rejected: "bg-destructive/10 text-destructive",
};

export default function ApplicationsPage() {
  const mounted = useHydrated();
  const applications = useDataStore((s) => s.applications);
  const setApplicationStatus = useDataStore((s) => s.setApplicationStatus);
  const updateApplication = useDataStore((s) => s.updateApplication);
  const deleteApplication = useDataStore((s) => s.deleteApplication);
  const addApplication = useDataStore((s) => s.addApplication);

  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");

  if (!mounted) return null;

  function handleAdd() {
    if (!company.trim() || !position.trim()) return;
    addApplication({
      company,
      position,
      resumeVersionId: "",
      atsScore: 0,
      recruiterScore: 0,
      overallScore: 0,
      status: "saved",
    });
    setCompany("");
    setPosition("");
    setOpen(false);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Application Tracker</h1>
          <p className="mt-1 text-muted-foreground">Track every application, from saved to offer.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add application
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add application</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Input value={position} onChange={(e) => setPosition(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {applications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            No applications tracked yet. Optimize a resume for a job and click &quot;Track this
            application&quot;, or add one manually.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Scores</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.company}</TableCell>
                    <TableCell>
                      {a.resumeVersionId ? (
                        <Link href={`/resumes/${a.resumeVersionId}`} className="text-primary hover:underline">
                          {a.position}
                        </Link>
                      ) : (
                        a.position
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {a.resumeVersionId ? `${a.overallScore} overall · ${a.atsScore} ATS · ${a.recruiterScore} rec` : "—"}
                    </TableCell>
                    <TableCell>
                      <Select value={a.status} onValueChange={(v) => setApplicationStatus(a.id, v as ApplicationStatus)}>
                        <SelectTrigger className="h-8 w-[140px]">
                          <SelectValue>
                            <Badge className={STATUS_VARIANT[a.status]}>{STATUSES.find((s) => s.value === a.status)?.label}</Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {format(new Date(a.updatedAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="min-w-[180px]">
                      <Textarea
                        rows={1}
                        placeholder="Notes…"
                        value={a.notes ?? ""}
                        onChange={(e) => updateApplication(a.id, { notes: e.target.value })}
                        className="min-h-8 resize-none text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => deleteApplication(a.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
