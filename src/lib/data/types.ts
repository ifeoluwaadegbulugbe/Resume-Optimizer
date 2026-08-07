import type {
  ResumeData,
  JobDescriptionAnalysis,
  OptimizedResume,
  ResumeTemplate,
  ApplicationRecord,
  ChatMessage,
} from "@/types/resume";

export interface SavedResume {
  id: string;
  title: string;
  isMaster: boolean;
  sourceFileName?: string;
  sourceFileType?: string;
  rawText?: string;
  resumeData: ResumeData;
  createdAt: string;
  updatedAt: string;
}

export interface SavedJobDescription {
  id: string;
  companyName: string;
  jobTitle: string;
  jobLocation: string;
  companyWebsite?: string;
  companyValues?: string;
  rawText: string;
  analysis?: JobDescriptionAnalysis;
  createdAt: string;
  updatedAt: string;
}

export interface SavedResumeVersion {
  id: string;
  masterResumeId: string;
  jobDescriptionId: string;
  label: string;
  template: ResumeTemplate;
  optimized: OptimizedResume;
  status: "draft" | "final";
  chatMessages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export type SavedApplication = ApplicationRecord;
