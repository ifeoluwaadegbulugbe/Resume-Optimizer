import { NextRequest } from "next/server";
import { runColdEmailPipeline } from "@/lib/ai/coldEmailPipeline";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import type { ColdEmailInput } from "@/types/coldEmail";

export const runtime = "nodejs";
export const maxDuration = 300;

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

  const input = (await req.json()) as ColdEmailInput;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        const result = await runColdEmailPipeline(input, (stage, iteration) =>
          send({ type: "progress", stage, iteration })
        );
        send({ type: "done", result });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Cold email generation failed.";
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
