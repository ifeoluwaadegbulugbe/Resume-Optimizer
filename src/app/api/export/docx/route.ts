import { NextRequest, NextResponse } from "next/server";
import { buildResumeDocx } from "@/lib/export/docxDocument";
import type { ResumeData } from "@/types/resume";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { resumeData } = (await req.json()) as { resumeData: ResumeData };
    const buffer = await buildResumeDocx(resumeData);
    const fileName = `${(resumeData.contact.fullName || "resume").replace(/\s+/g, "_")}_Resume.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate DOCX.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
