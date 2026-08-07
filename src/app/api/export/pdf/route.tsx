import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ResumePdfDocument } from "@/lib/export/pdfDocument";
import type { ResumeData, ResumeTemplate } from "@/types/resume";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { resumeData, template } = (await req.json()) as {
    resumeData: ResumeData;
    template: ResumeTemplate;
  };

  const element = <ResumePdfDocument data={resumeData} template={template} />;

  try {
    const buffer = await renderToBuffer(element);
    const fileName = `${(resumeData.contact.fullName || "resume").replace(/\s+/g, "_")}_Resume.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
