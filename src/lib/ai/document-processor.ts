import path from 'path';
import fs from 'fs/promises';

export interface ParsedChunk {
  chunkIndex: number;
  content: string;
  pageNumber?: number;
  sectionHeading?: string;
  tokenEstimate: number;
}

export interface ParsedDocument {
  title: string;
  rawText: string;
  chunks: ParsedChunk[];
  pageCount?: number;
}

const MAX_CHUNK_CHARS = 1800;
const OVERLAP_CHARS = 150;

// ─── Main parser dispatcher ───────────────────────────────────────────────────
export async function parseDocument(
  filePath: string,
  fileName: string
): Promise<ParsedDocument> {
  const ext = path.extname(fileName).toLowerCase();
  const title = path.basename(fileName, ext);

  switch (ext) {
    case '.pdf': return parsePDF(filePath, title);
    case '.docx': return parseDOCX(filePath, title);
    case '.doc': return parseDOC(filePath, title);
    case '.xlsx':
    case '.xls': return parseXLSX(filePath, title);
    case '.csv': return parseCSV(filePath, title);
    case '.txt': return parseTXT(filePath, title);
    default: return parseTXT(filePath, title);
  }
}

// ─── PDF Parser ───────────────────────────────────────────────────────────────
async function parsePDF(filePath: string, title: string): Promise<ParsedDocument> {
  // Dynamic import to avoid SSR issues
  const pdfParse = (await import('pdf-parse')).default;
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);

  const rawText = data.text;
  const pageCount = data.numpages;

  // Try to split by page markers or headings
  const chunks = chunkTextSmart(rawText, MAX_CHUNK_CHARS, OVERLAP_CHARS);

  return { title, rawText, chunks, pageCount };
}

// ─── DOC Parser (legacy Word 97-2003) ─────────────────────────────────────────
async function parseDOC(filePath: string, title: string): Promise<ParsedDocument> {
  const WordExtractor = (await import('word-extractor')).default;
  const extractor = new WordExtractor();
  const doc = await extractor.extract(filePath);
  const rawText = doc.getBody();
  const chunks = chunkTextSmart(rawText, MAX_CHUNK_CHARS, OVERLAP_CHARS);
  return { title, rawText, chunks };
}

// ─── DOCX Parser ──────────────────────────────────────────────────────────────
async function parseDOCX(filePath: string, title: string): Promise<ParsedDocument> {
  const mammoth = await import('mammoth');
  const buffer = await fs.readFile(filePath);
  const result = await mammoth.extractRawText({ buffer });
  const rawText = result.value;
  const chunks = chunkTextSmart(rawText, MAX_CHUNK_CHARS, OVERLAP_CHARS);
  return { title, rawText, chunks };
}

// ─── XLSX Parser ──────────────────────────────────────────────────────────────
async function parseXLSX(filePath: string, title: string): Promise<ParsedDocument> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sections: string[] = [];

  workbook.eachSheet(sheet => {
    const rows: string[] = [];
    sheet.eachRow({ includeEmpty: false }, row => {
      const cells = (row.values as (string | number | boolean | null | undefined)[])
        .slice(1)
        .map(v => (v != null ? String(v) : ''))
        .filter(v => v.trim());
      if (cells.length > 0) rows.push(cells.join(' | '));
    });
    if (rows.length > 0) {
      sections.push(`[Sheet: ${sheet.name}]\n${rows.join('\n')}`);
    }
  });

  const rawText = sections.join('\n\n');
  const chunks = chunkTextSmart(rawText, MAX_CHUNK_CHARS, OVERLAP_CHARS);
  return { title, rawText, chunks };
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────
async function parseCSV(filePath: string, title: string): Promise<ParsedDocument> {
  const raw = await fs.readFile(filePath, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  const rawText = lines.join('\n');
  const chunks = chunkTextSmart(rawText, MAX_CHUNK_CHARS, OVERLAP_CHARS);
  return { title, rawText, chunks };
}

// ─── TXT Parser ───────────────────────────────────────────────────────────────
async function parseTXT(filePath: string, title: string): Promise<ParsedDocument> {
  const rawText = await fs.readFile(filePath, 'utf-8');
  const chunks = chunkTextSmart(rawText, MAX_CHUNK_CHARS, OVERLAP_CHARS);
  return { title, rawText, chunks };
}

// ─── Smart chunker ────────────────────────────────────────────────────────────
function chunkTextSmart(
  text: string,
  maxChars: number,
  overlap: number
): ParsedChunk[] {
  const chunks: ParsedChunk[] = [];

  // Split by headings first (lines that are ALL CAPS or start with number + dot or #)
  const sectionSplitter = /\n(?=[A-Z][A-Z\s]{4,}:|(?:\d+\.|#{1,3})\s)/g;
  const sections = text.split(sectionSplitter);

  let chunkIndex = 0;
  let currentSection = '';

  for (const section of sections) {
    const heading = extractHeading(section);
    const content = section.trim();

    if (content.length <= maxChars) {
      if (content.length > 50) {
        chunks.push({
          chunkIndex: chunkIndex++,
          content,
          sectionHeading: heading ?? undefined,
          tokenEstimate: Math.ceil(content.length / 4),
        });
      }
      continue;
    }

    // Split long sections into overlapping chunks
    let start = 0;
    while (start < content.length) {
      const end = Math.min(start + maxChars, content.length);
      const chunk = content.slice(start, end).trim();

      if (chunk.length > 50) {
        chunks.push({
          chunkIndex: chunkIndex++,
          content: chunk,
          sectionHeading: heading ?? undefined,
          tokenEstimate: Math.ceil(chunk.length / 4),
        });
      }

      if (end >= content.length) break;
      start = end - overlap;
    }
  }

  return chunks;
}

function extractHeading(text: string): string | null {
  const lines = text.trim().split('\n');
  const firstLine = lines[0]?.trim() ?? '';
  if (firstLine.length > 5 && firstLine.length < 100) {
    if (/^[A-Z\s:/-]{5,}$/.test(firstLine) || /^(?:\d+\.|#{1,3})\s/.test(firstLine)) {
      return firstLine.replace(/^#{1,3}\s/, '').replace(/:$/, '').trim();
    }
  }
  return null;
}
