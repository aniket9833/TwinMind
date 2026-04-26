import { NextRequest } from 'next/server';
import { createGroqClient, GROQ_MODEL } from '@/lib/groq';
import type { TranscriptChunk, ChatMessage } from '@/lib/types';

interface ChatRequest {
  messages: ChatMessage[];
  transcript: TranscriptChunk[];
  isDetailExpand: boolean;
  settings: {
    chatContextLines: number;
    chatMaxTokens: number;
    chatPrompt: string;
    detailPrompt: string;
  };
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-groq-key');
  if (!apiKey) {
    return new Response('Missing Groq API key', { status: 401 });
  }

  const body: ChatRequest = await req.json();
  const { messages, transcript, isDetailExpand, settings } = body;

  const recentChunks = transcript.slice(-settings.chatContextLines);
  const transcriptContext =
    recentChunks.length > 0
      ? `\n\nFull conversation transcript for context:\n${recentChunks
          .map((c) => `[${c.timestamp}] ${c.text}`)
          .join('\n')}`
      : '\n\n(No transcript available yet)';

  const systemPrompt =
    (isDetailExpand ? settings.detailPrompt : settings.chatPrompt) +
    transcriptContext;

  const groqMessages = messages
    .filter((m) => !m.isStreaming)
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  try {
    const groq = createGroqClient(apiKey);

    const stream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: settings.chatMaxTokens,
      temperature: 0.6,
      stream: true,
      messages: [{ role: 'system', content: systemPrompt }, ...groqMessages],
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content ?? '';
            if (token) {
              controller.enqueue(new TextEncoder().encode(token));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Chat failed';
    console.error('Chat error:', message);
    return new Response(message, { status: 500 });
  }
}
