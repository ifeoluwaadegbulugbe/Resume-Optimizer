// Hand-written to match supabase/migrations/0001_init.sql.
// If you use the Supabase CLI, you can regenerate this with:
//   supabase gen types typescript --project-id <id> > src/types/database.ts

import type {
  ResumeData,
  JobDescriptionAnalysis,
  ResumeTemplate,
  ATSScoreBreakdown,
  RecruiterScoreBreakdown,
  ApplicationStatus,
} from "./resume";

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          plan: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & { id: string; email: string };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          is_master: boolean;
          source_file_name: string | null;
          source_file_type: string | null;
          raw_text: string | null;
          resume_data: ResumeData & Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["resumes"]["Row"]> & {
          user_id: string;
          resume_data: ResumeData & Json;
        };
        Update: Partial<Database["public"]["Tables"]["resumes"]["Row"]>;
      };
      job_descriptions: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          job_title: string;
          job_location: string | null;
          company_website: string | null;
          company_values: string | null;
          raw_text: string;
          analysis: (JobDescriptionAnalysis & Json) | null;
          analysis_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["job_descriptions"]["Row"]> & {
          user_id: string;
          company_name: string;
          job_title: string;
          raw_text: string;
        };
        Update: Partial<Database["public"]["Tables"]["job_descriptions"]["Row"]>;
      };
      resume_versions: {
        Row: {
          id: string;
          user_id: string;
          master_resume_id: string;
          job_description_id: string;
          label: string;
          template: ResumeTemplate;
          resume_data: ResumeData & Json;
          word_count: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["resume_versions"]["Row"]> & {
          user_id: string;
          master_resume_id: string;
          job_description_id: string;
          label: string;
          resume_data: ResumeData & Json;
        };
        Update: Partial<Database["public"]["Tables"]["resume_versions"]["Row"]>;
      };
      resume_analyses: {
        Row: {
          id: string;
          user_id: string;
          resume_version_id: string;
          experience_relevance: Json | null;
          gap_analysis: Json | null;
          hallucination_flags: Json | null;
          what_improved: Json | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["resume_analyses"]["Row"]> & {
          user_id: string;
          resume_version_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["resume_analyses"]["Row"]>;
      };
      keyword_matches: {
        Row: {
          id: string;
          resume_version_id: string;
          keyword: string;
          priority: string;
          status: string;
          why_it_matters: string | null;
          where_it_fits: string | null;
          found_in: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["keyword_matches"]["Row"]> & {
          resume_version_id: string;
          keyword: string;
          priority: string;
          status: string;
        };
        Update: Partial<Database["public"]["Tables"]["keyword_matches"]["Row"]>;
      };
      resume_scores: {
        Row: {
          id: string;
          resume_version_id: string;
          ats_score: number;
          ats_breakdown: ATSScoreBreakdown & Json;
          recruiter_score: number;
          recruiter_breakdown: RecruiterScoreBreakdown & Json;
          overall_score: number;
          job_match_pct: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["resume_scores"]["Row"]> & {
          resume_version_id: string;
          ats_score: number;
          ats_breakdown: ATSScoreBreakdown & Json;
          recruiter_score: number;
          recruiter_breakdown: RecruiterScoreBreakdown & Json;
          overall_score: number;
          job_match_pct: number;
        };
        Update: Partial<Database["public"]["Tables"]["resume_scores"]["Row"]>;
      };
      experience_entries: {
        Row: {
          id: string;
          resume_id: string;
          company: string;
          title: string;
          location: string | null;
          start_date: string | null;
          end_date: string | null;
          bullets: Json;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["experience_entries"]["Row"]> & {
          resume_id: string;
          company: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["experience_entries"]["Row"]>;
      };
      resume_changes: {
        Row: {
          id: string;
          resume_version_id: string;
          change_type: string;
          target_path: string;
          before_value: Json | null;
          after_value: Json | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["resume_changes"]["Row"]> & {
          resume_version_id: string;
          change_type: string;
          target_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["resume_changes"]["Row"]>;
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          resume_version_id: string | null;
          job_description_id: string | null;
          company: string;
          position: string;
          date_applied: string | null;
          status: ApplicationStatus;
          interview_status: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["applications"]["Row"]> & {
          user_id: string;
          company: string;
          position: string;
        };
        Update: Partial<Database["public"]["Tables"]["applications"]["Row"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: string;
          status: string;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]>;
      };
    };
  };
}
