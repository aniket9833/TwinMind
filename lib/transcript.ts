export interface RecorderHandle {
  stop: () => void;
}

export async function startRecording(
  onChunk: (blob: Blob) => void,
  chunkIntervalMs = 30_000,
): Promise<RecorderHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 16000,
    },
  });

  // Pick best supported MIME type
  const mimeType = getSupportedMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      onChunk(e.data);
    }
  };

  recorder.onerror = (e) => {
    console.error('MediaRecorder error:', e);
  };

  recorder.start(chunkIntervalMs);

  return {
    stop: () => {
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}

function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

export function blobToFile(blob: Blob, filename = 'audio.webm'): File {
  return new File([blob], filename, { type: blob.type || 'audio/webm' });
}
