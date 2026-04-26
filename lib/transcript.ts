export interface RecorderHandle {
  stop: () => Promise<void>;
}

export async function startRecording(
  onChunk: (blob: Blob) => void,
  chunkIntervalMs = 6_000,
): Promise<RecorderHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 16_000,
    },
  });

  const mimeType = getSupportedMimeType();
  let recorder: MediaRecorder | null = null;
  let rotationTimer: NodeJS.Timeout | null = null;
  let isStopping = false;
  let stopResolver: (() => void) | null = null;

  const clearRotationTimer = () => {
    if (rotationTimer) {
      clearTimeout(rotationTimer);
      rotationTimer = null;
    }
  };

  const cleanupStream = () => {
    stream.getTracks().forEach((track) => track.stop());
  };

  const startSegment = () => {
    if (isStopping) return;

    const nextRecorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined,
    );
    const parts: BlobPart[] = [];

    nextRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        parts.push(event.data);
      }
    };

    nextRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
    };

    nextRecorder.onstop = () => {
      clearRotationTimer();

      if (parts.length > 0) {
        const blob = new Blob(parts, {
          type: nextRecorder.mimeType || mimeType || 'audio/webm',
        });

        if (blob.size > 0) {
          onChunk(blob);
        }
      }

      if (isStopping) {
        cleanupStream();
        stopResolver?.();
        stopResolver = null;
        return;
      }

      startSegment();
    };

    recorder = nextRecorder;
    nextRecorder.start();
    rotationTimer = setTimeout(() => {
      if (nextRecorder.state === 'recording') {
        nextRecorder.stop();
      }
    }, chunkIntervalMs);
  };

  startSegment();

  return {
    stop: () =>
      new Promise<void>((resolve) => {
        isStopping = true;
        stopResolver = resolve;
        clearRotationTimer();

        if (!recorder || recorder.state === 'inactive') {
          cleanupStream();
          stopResolver?.();
          stopResolver = null;
          return;
        }

        recorder.stop();
      }),
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

function getExtensionForMimeType(type: string): string {
  if (type.includes('ogg')) return 'ogg';
  if (type.includes('mp4')) return 'mp4';
  return 'webm';
}

export function blobToFile(blob: Blob, filename?: string): File {
  const type = blob.type || 'audio/webm';
  const resolvedFilename = filename ?? `audio.${getExtensionForMimeType(type)}`;
  return new File([blob], resolvedFilename, { type });
}
