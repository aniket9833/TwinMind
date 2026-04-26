export type SuggestionType =
  | 'QUESTION_TO_ASK'
  | 'TALKING_POINT'
  | 'ANSWER'
  | 'FACT_CHECK'
  | 'CLARIFICATION';

export interface Suggestion {
  id: string;
  type: SuggestionType;
  preview: string;
  detail_prompt: string;
}

export interface SuggestionBatch {
  id: string;
  timestamp: string;
  suggestions: Suggestion[];
}

export interface TranscriptChunk {
  id: string;
  text: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface AppSettings {
  groqApiKey: string;
  suggestionContextLines: number;
  chatContextLines: number;
  suggestionMaxTokens: number;
  chatMaxTokens: number;
  suggestionPrompt: string;
  chatPrompt: string;
  detailPrompt: string;
}
