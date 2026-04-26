import { NextRequest, NextResponse } from 'next/server';
import { createGroqClient, WHISPER_MODEL } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-groq-key');
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing Groq API key' },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const audioFile = formData.get('audio');
  if (!audioFile || !(audioFile instanceof File)) {
    return NextResponse.json(
      { error: 'No audio file provided' },
      { status: 400 },
    );
  }

  if (audioFile.size < 100) {
    return NextResponse.json({ text: '' });
  }

  try {
    const groq = createGroqClient(apiKey);

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: WHISPER_MODEL,
      response_format: 'json',
      language: 'en',
    });

    return NextResponse.json({ text: transcription.text?.trim() ?? '' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Transcription failed';
    console.error('Transcription error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
