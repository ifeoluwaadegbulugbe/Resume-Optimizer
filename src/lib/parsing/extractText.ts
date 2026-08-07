export type SourceFileType = "pdf" | "docx" | "txt";

export function detectFileType(fileName: string, mimeType: string): SourceFileType | null {
  const lower = fileName.toLowerCase();
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) return "pdf";
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  )
    return "docx";
  if (mimeType === "text/plain" || lower.endsWith(".txt")) return "txt";
  return null;
}

export async function extractTextFromFile(buffer: Buffer, type: SourceFileType): Promise<string> {
  switch (type) {
    case "pdf": {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return result.text;
      } finally {
        await parser.destroy();
      }
    }
    case "docx": {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case "txt":
      return buffer.toString("utf-8");
  }
}

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB
