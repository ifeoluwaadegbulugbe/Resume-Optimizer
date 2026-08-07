import { create } from "zustand";
import { persist } from "zustand/middleware";
import { randomUUID } from "@/lib/utils/uuid";
import type { SavedResume, SavedJobDescription, SavedResumeVersion, SavedApplication } from "./types";
import type { ApplicationStatus } from "@/types/resume";

// This is the app's data layer. It persists to localStorage so the full
// product (dashboard, versioning, tracker) is usable immediately in "guest
// mode" — no Supabase project required to try it. The SQL schema in
// supabase/migrations already mirrors these shapes 1:1 for when real auth +
// sync is wired in; see README for the sync notes.

interface DataState {
  resumes: SavedResume[];
  jobDescriptions: SavedJobDescription[];
  resumeVersions: SavedResumeVersion[];
  applications: SavedApplication[];

  addResume: (r: Omit<SavedResume, "id" | "createdAt" | "updatedAt">) => SavedResume;
  updateResume: (id: string, patch: Partial<SavedResume>) => void;
  deleteResume: (id: string) => void;
  setMasterResume: (id: string) => void;

  addJobDescription: (jd: Omit<SavedJobDescription, "id" | "createdAt" | "updatedAt">) => SavedJobDescription;
  updateJobDescription: (id: string, patch: Partial<SavedJobDescription>) => void;

  addResumeVersion: (v: Omit<SavedResumeVersion, "id" | "createdAt" | "updatedAt">) => SavedResumeVersion;
  updateResumeVersion: (id: string, patch: Partial<SavedResumeVersion>) => void;
  deleteResumeVersion: (id: string) => void;

  addApplication: (a: Omit<SavedApplication, "id" | "updatedAt">) => SavedApplication;
  updateApplication: (id: string, patch: Partial<SavedApplication>) => void;
  setApplicationStatus: (id: string, status: ApplicationStatus) => void;
  deleteApplication: (id: string) => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      resumes: [],
      jobDescriptions: [],
      resumeVersions: [],
      applications: [],

      addResume: (r) => {
        const now = new Date().toISOString();
        const resume: SavedResume = { ...r, id: randomUUID(), createdAt: now, updatedAt: now };
        set((s) => ({
          resumes: resume.isMaster
            ? [...s.resumes.map((x) => ({ ...x, isMaster: false })), resume]
            : [...s.resumes, resume],
        }));
        return resume;
      },
      updateResume: (id, patch) =>
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r
          ),
        })),
      deleteResume: (id) =>
        set((s) => ({
          resumes: s.resumes.filter((r) => r.id !== id),
          resumeVersions: s.resumeVersions.filter((v) => v.masterResumeId !== id),
        })),
      setMasterResume: (id) =>
        set((s) => ({
          resumes: s.resumes.map((r) => ({ ...r, isMaster: r.id === id })),
        })),

      addJobDescription: (jd) => {
        const now = new Date().toISOString();
        const record: SavedJobDescription = { ...jd, id: randomUUID(), createdAt: now, updatedAt: now };
        set((s) => ({ jobDescriptions: [...s.jobDescriptions, record] }));
        return record;
      },
      updateJobDescription: (id, patch) =>
        set((s) => ({
          jobDescriptions: s.jobDescriptions.map((j) =>
            j.id === id ? { ...j, ...patch, updatedAt: new Date().toISOString() } : j
          ),
        })),

      addResumeVersion: (v) => {
        const now = new Date().toISOString();
        const record: SavedResumeVersion = { ...v, id: randomUUID(), createdAt: now, updatedAt: now };
        set((s) => ({ resumeVersions: [...s.resumeVersions, record] }));
        return record;
      },
      updateResumeVersion: (id, patch) =>
        set((s) => ({
          resumeVersions: s.resumeVersions.map((v) =>
            v.id === id ? { ...v, ...patch, updatedAt: new Date().toISOString() } : v
          ),
        })),
      deleteResumeVersion: (id) =>
        set((s) => ({
          resumeVersions: s.resumeVersions.filter((v) => v.id !== id),
          applications: s.applications.map((a) =>
            a.resumeVersionId === id ? { ...a, resumeVersionId: "" } : a
          ),
        })),

      addApplication: (a) => {
        const record: SavedApplication = { ...a, id: randomUUID(), updatedAt: new Date().toISOString() };
        set((s) => ({ applications: [...s.applications, record] }));
        return record;
      },
      updateApplication: (id, patch) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a
          ),
        })),
      setApplicationStatus: (id, status) => get().updateApplication(id, { status }),
      deleteApplication: (id) => set((s) => ({ applications: s.applications.filter((a) => a.id !== id) })),
    }),
    { name: "forma-resume-data" }
  )
);
