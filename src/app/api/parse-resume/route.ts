import { NextRequest, NextResponse } from "next/server";
import { detectFileType, extractTextFromFile, MAX_UPLOAD_BYTES } from "@/lib/parsing/extractText";
import { parseResumeText } from "@/lib/ai/stages/parseResume";
import { isGeminiConfigured } from "@/lib/ai/gemini";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server yet. Add it to .env.local and restart the dev server." },
      { status: 503 }
    );
  }

  const contentType = req.headers.get("content-type") || "";
  let rawText = "";
  let sourceFileName: string | null = null;
  let sourceFileType: string | null = null;

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file provided." }, { status: 400 });
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: "File exceeds 8MB limit." }, { status: 400 });
      }
      const type = detectFileType(file.name, file.type);
      if (!type) {
        return NextResponse.json(
          { error: "Unsupported file type. Please upload a PDF, DOCX, or TXT file." },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      rawText = await extractTextFromFile(buffer, type);
      sourceFileName = file.name;
      sourceFileType = type;
    } else {
      const body = await req.json();
      rawText = body.text ?? "";
      sourceFileType = "pasted";
    }

    if (!rawText || rawText.trim().length < 30) {
      return NextResponse.json(
        { error: "Couldn't find enough text to parse. Try pasting your resume text directly." },
        { status: 400 }
      );
    }

    const resumeData = await parseResumeText(rawText);

    return NextResponse.json({ resumeData, rawText, sourceFileName, sourceFileType });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
