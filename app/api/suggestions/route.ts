import { NextRequest, NextResponse } from 'next/server';
import { createGroqClient, GROQ_MODEL } from '@/lib/groq';
import { parseSuggestions } from '@/lib/parser';
import type { TranscriptChunk, Suggestion } from '@/lib/types';

interface SuggestionsRequest {
  transcript: TranscriptChunk[];
  previousBatch: Suggestion[];
  settings: {
    suggestionContextLines: number;
    suggestionMaxTokens: number;
    suggestionPrompt: string;
  };
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-groq-key');
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing Groq API key' },
      { status: 401 },
    );
  }

  const body: SuggestionsRequest = await req.json();
  const { transcript, previousBatch, settings } = body;

  if (!transcript || transcript.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  const recentChunks = transcript.slice(-settings.suggestionContextLines);
  const transcriptText = recentChunks
    .map((c) => `[${c.timestamp}] ${c.text}`)
    .join('\n');

  const prevPreviews =
    previousBatch.length > 0
      ? `\nPrevious suggestions to avoid repeating:\n${previousBatch
          .map((s) => `- ${s.preview}`)
          .join('\n')}`
      : '';

  const userMessage = `${prevPreviews}\n\nRecent transcript:\n${transcriptText}`;

  try {
    const groq = createGroqClient(apiKey);

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: settings.suggestionMaxTokens,
      temperature: 0.7,
      messages: [
        { role: 'system', content: settings.suggestionPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '[]';
    const suggestions = parseSuggestions(raw);

    if (suggestions.length === 0) {
      return NextResponse.json(
        { error: 'Failed to parse suggestions', raw },
        { status: 500 },
      );
    }

    return NextResponse.json({ suggestions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Suggestions failed';
    console.error('Suggestions error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
