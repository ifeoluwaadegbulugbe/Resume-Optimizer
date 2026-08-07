import { NextRequest } from "next/server";
import { runOptimizationPipeline } from "@/lib/ai/pipeline";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import type { ResumeData, ResumeTemplate } from "@/types/resume";

export const runtime = "nodejs";
export const maxDuration = 300;

interface AnalyzeRequestBody {
  resumeData: ResumeData;
  jobDescription: {
    rawText: string;
    companyName: string;
    jobTitle: string;
    jobLocation: string;
    companyWebsite?: string;
    companyValues?: string;
  };
  template?: ResumeTemplate;
}

export async function POST(req: NextRequest) {
  if (!isGeminiConfigured()) {
    return new Response(
      JSON.stringify({
        type: "error",
        message:
          "GEMINI_API_KEY is not configured on the server yet. Add it to .env.local and restart the dev server.",
      }) + "\n",
      { status: 503, headers: { "Content-Type": "application/x-ndjson" } }
    );
  }

  const body = (await req.json()) as AnalyzeRequestBody;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        const { optimized, jobAnalysis } = await runOptimizationPipeline(
          {
            resumeData: body.resumeData,
            jobDescription: body.jobDescription,
            template: body.template,
          },
          (stage, iteration) => send({ type: "progress", stage, iteration })
        );
        send({ type: "done", optimized, jobAnalysis });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed.";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
}
