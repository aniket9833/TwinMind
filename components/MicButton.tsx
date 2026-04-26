'use client';

interface MicButtonProps {
  isRecording: boolean;
  isTranscribing: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function MicButton({
  isRecording,
  isTranscribing,
  onClick,
  disabled,
}: MicButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isTranscribing}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      className={`
        relative flex items-center justify-center w-12 h-12 rounded-full
        transition-all duration-200 focus:outline-none
        ${
          isRecording
            ? 'bg-red-500/20 border border-red-500/50 recording-pulse'
            : 'bg-[#1c1c25] border border-[#ffffff14] hover:border-[#ffffff30] hover:bg-[#22222d]'
        }
        ${disabled || isTranscribing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {isTranscribing ? (
        <svg
          className="w-5 h-5 animate-spin text-[#9090a8]"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : isRecording ? (
        <span className="w-4 h-4 rounded-sm bg-red-400" />
      ) : (
        <svg
          className="w-5 h-5 text-[#9090a8]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
          />
        </svg>
      )}
    </button>
  );
}
