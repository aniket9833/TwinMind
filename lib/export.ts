import type { TranscriptChunk, SuggestionBatch, ChatMessage } from './types';

interface ExportData {
  transcript: TranscriptChunk[];
  suggestionBatches: SuggestionBatch[];
  chatMessages: ChatMessage[];
}

export function buildExportText(data: ExportData): string {
  const lines: string[] = [];

  lines.push('=== TWINMIND SESSION EXPORT ===');
  lines.push(`Exported at: ${new Date().toISOString()}`);
  lines.push('');

  // Transcript
  lines.push('--- TRANSCRIPT ---');
  if (data.transcript.length === 0) {
    lines.push('(no transcript)');
  } else {
    for (const chunk of data.transcript) {
      lines.push(`[${chunk.timestamp}] ${chunk.text}`);
    }
  }
  lines.push('');

  // Suggestions
  lines.push('--- SUGGESTION BATCHES ---');
  if (data.suggestionBatches.length === 0) {
    lines.push('(no suggestions generated)');
  } else {
    for (let i = 0; i < data.suggestionBatches.length; i++) {
      const batch = data.suggestionBatches[i];
      lines.push(
        `\nBatch ${data.suggestionBatches.length - i} @ ${batch.timestamp}`,
      );
      for (const s of batch.suggestions) {
        lines.push(`  [${s.type}] ${s.preview}`);
        lines.push(`  Detail prompt: ${s.detail_prompt}`);
      }
    }
  }
  lines.push('');

  // Chat
  lines.push('--- CHAT HISTORY ---');
  if (data.chatMessages.length === 0) {
    lines.push('(no chat messages)');
  } else {
    for (const msg of data.chatMessages) {
      lines.push(`[${msg.timestamp}] ${msg.role.toUpperCase()}:`);
      lines.push(msg.content);
      lines.push('');
    }
  }

  return lines.join('\n');
}

export function buildExportJson(data: ExportData): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      transcript: data.transcript,
      suggestionBatches: data.suggestionBatches,
      chatMessages: data.chatMessages.map((m) => ({
        ...m,
        isStreaming: undefined,
      })),
    },
    null,
    2,
  );
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
