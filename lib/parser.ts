import type { Suggestion, SuggestionType } from './types';

const VALID_TYPES: SuggestionType[] = [
  'QUESTION_TO_ASK',
  'TALKING_POINT',
  'ANSWER',
  'FACT_CHECK',
  'CLARIFICATION',
];

function isValidType(t: unknown): t is SuggestionType {
  return typeof t === 'string' && VALID_TYPES.includes(t as SuggestionType);
}

export function parseSuggestions(raw: string): Suggestion[] {
  try {
    // Strip markdown code fences if present
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    const arr: unknown[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.suggestions)
        ? parsed.suggestions
        : [];

    return arr
      .slice(0, 3)
      .map((item, i) => {
        if (typeof item !== 'object' || item === null) return null;
        const s = item as Record<string, unknown>;
        return {
          id: `s-${Date.now()}-${i}`,
          type: isValidType(s.type) ? s.type : 'TALKING_POINT',
          preview: typeof s.preview === 'string' ? s.preview : '...',
          detail_prompt:
            typeof s.detail_prompt === 'string' ? s.detail_prompt : '',
        } satisfies Suggestion;
      })
      .filter((s): s is Suggestion => s !== null);
  } catch {
    return [];
  }
}
