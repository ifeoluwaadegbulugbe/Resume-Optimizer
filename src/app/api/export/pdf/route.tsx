import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ResumePdfDocument, DENSITY_TIERS } from "@/lib/export/pdfDocument";
import type { ResumeData, ResumeTemplate } from "@/types/resume";

export const runtime = "nodejs";

async function countPages(pdfBuffer: Buffer): Promise<number> {
  // Same CanvasFactory requirement as text extraction — see
  // src/lib/parsing/extractText.ts for why this is needed in serverless.
  const [{ CanvasFactory }, { PDFParse }] = await Promise.all([
    import("pdf-parse/worker"),
    import("pdf-parse"),
  ]);
  const parser = new PDFParse({ data: pdfBuffer, CanvasFactory });
  try {
    const info = await parser.getInfo();
    return info.total;
  } finally {
    await parser.destroy();
  }
}

/** Renders at progressively tighter densities until the PDF fits on one
 * page, falling back to the tightest tier if it never does. */
async function renderSinglePage(resumeData: ResumeData, template: ResumeTemplate): Promise<Buffer> {
  const elements = DENSITY_TIERS.map((density) => (
    <ResumePdfDocument key={density} data={resumeData} template={template} density={density} />
  ));

  let buffer: Buffer | null = null;
  for (const element of elements) {
    const candidate = await renderToBuffer(element);
    buffer = candidate;
    const pageCount = await countPages(candidate);
    if (pageCount <= 1) break;
  }
  return buffer!;
}

export async function POST(req: NextRequest) {
  const { resumeData, template } = (await req.json()) as {
    resumeData: ResumeData;
    template: ResumeTemplate;
  };

  try {
    const buffer = await renderSinglePage(resumeData, template);
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
