import { gemini, MODEL } from './client';
import { semanticSearch, buildContext } from './embeddings';
import { buildAnalysisPrompt } from './prompts';
import { redactPII } from '@/lib/utils/helpers';
import type { TicketInput, AnalysisResult } from '@/types';

export async function analyzeTicket(input: TicketInput): Promise<AnalysisResult> {
  // Build a rich search query from the ticket
  const searchQuery = [
    input.complaint,
    input.clubTeamName && `club team ${input.clubTeamName}`,
    input.orderNumber && `order ${input.orderNumber}`,
  ].filter(Boolean).join(' ');

  // Retrieve relevant training material via RAG
  const chunks = await semanticSearch(searchQuery, 10, 0.25);
  const context = buildContext(chunks);

  // Redact PII before sending to AI
  const safeInput: TicketInput = {
    ...input,
    complaint: redactPII(input.complaint),
    customerEmail: undefined,
  };

  const prompt = buildAnalysisPrompt(safeInput, context);

  const model = gemini.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.15,
      maxOutputTokens: 4096,
    } as any,
  });
  const completion = await model.generateContent(prompt);
  const raw = completion.response.text();
  if (!raw) throw new Error('No response from AI');

  let parsed: AnalysisResult;
  try {
    parsed = JSON.parse(raw) as AnalysisResult;
  } catch {
    throw new Error('Failed to parse AI analysis response');
  }

  // If no source references were generated but we have context, add them
  if ((!parsed.source_references || parsed.source_references.length === 0) && chunks.length > 0) {
    parsed.source_references = chunks.slice(0, 3).map(c => ({
      document_name: c.documentTitle,
      section: c.sectionHeading ?? 'General',
      page_number: c.pageNumber,
      relevant_rule: c.content.slice(0, 180),
      confidence: c.similarity > 0.7 ? 'HIGH' : c.similarity > 0.5 ? 'MEDIUM' : 'LOW',
      quote: undefined,
    }));
  }

  // No training docs uploaded yet
  if (chunks.length === 0) {
    parsed.escalation_needed = true;
    if (!parsed.source_references || parsed.source_references.length === 0) {
      parsed.source_references = [{
        document_name: 'No training documents uploaded',
        section: 'N/A',
        page_number: null,
        relevant_rule: 'Upload training materials in the Admin › Upload Center to enable evidence-based guidance.',
        confidence: 'UNVERIFIED',
      }];
    }
    parsed.agent_warnings = [
      ...(parsed.agent_warnings ?? []),
      {
        severity: 'warning',
        message: 'No training documents found in the knowledge base. Guidance is based on general CS best practices only. Please upload training materials.',
        rule: 'source_requirement',
      },
    ];
  }

  return parsed;
}
