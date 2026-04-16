import React, { useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUrlSettings } from "@/hooks/use-url-settings";
import { PRIMARY_PROVIDER, type ProviderName } from "@/lib/provider-features";
import { useFeatures } from "@/contexts/feature-context";
import { useVideoMode } from "@/contexts/video-mode-context";

interface Video {
  id: string;
  name: string;
  url: string;
}

interface VideoPlayerViewProps {
  video: Video;
  onBack: () => void;
}

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({
  video,
  onBack,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { settings } = useUrlSettings();
  const { providerFeatures } = useFeatures();
  const {
    videoElRef,
    transcriptionState,
    transcriptionOutputs,
    transcriptionActiveProviders,
    stopVideoTranscription,
    cleanupVideoTranscription,
  } = useVideoMode();

  const allProviders: ProviderName[] = [
    PRIMARY_PROVIDER,
    ...settings.selectedProviders.filter((p) => p !== PRIMARY_PROVIDER),
  ];
  const isTranscribing = transcriptionState !== "idle";
  const displayProviders = isTranscribing ? transcriptionActiveProviders : allProviders;

  // Register this video element in the shared context
  useEffect(() => {
    videoElRef.current = videoRef.current;
    return () => {
      videoElRef.current = null;
    };
  }, [videoElRef]);

  // Stop transcription when video ends (don't pause — it already ended)
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onEnded = () => stopVideoTranscription(false);
    vid.addEventListener("ended", onEnded);
    return () => vid.removeEventListener("ended", onEnded);
  }, [stopVideoTranscription]);

  // Cleanup AudioContext on unmount
  useEffect(() => () => cleanupVideoTranscription(), [cleanupVideoTranscription]);

  const handleBack = () => {
    stopVideoTranscription(true);
    onBack();
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#101211]">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-[#2e3330] bg-[#0d1110]">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-[0.78rem] font-medium text-[#5f6e6a] hover:text-[#e6edeb] transition-colors shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <p className="flex-1 text-[0.82rem] font-medium text-[#e6edeb] truncate text-center px-2">
          {video.name}
        </p>
        {/* Spacer to keep title centered */}
        <div className="shrink-0 w-12" />
      </div>

      {/* Video player */}
      <div
        className="shrink-0 bg-black flex items-center justify-center"
        style={{ maxHeight: "42%" }}
      >
        <video
          ref={videoRef}
          src={video.url}
          controls
          crossOrigin="anonymous"
          className="w-full object-contain"
          style={{ maxHeight: "42vh" }}
        />
      </div>

      {/* Transcript panels */}
      <div className="flex-1 min-h-0 flex overflow-hidden border-t border-[#2e3330]">
        {displayProviders.map((provider, i) => {
          const output = transcriptionOutputs[provider];
          const modelName = providerFeatures?.[provider]?.model as string | undefined;
          return (
            <div
              key={provider}
              className={cn(
                "flex-1 flex flex-col min-w-0",
                i > 0 && "border-l border-[#2e3330]"
              )}
            >
              <div className="shrink-0 py-2 px-3 border-b border-[#2e3330] bg-[#1d201f] text-center">
                <p className="text-[0.78rem] font-semibold text-[#e6edeb] capitalize">
                  {provider}
                </p>
                {modelName && (
                  <p className="text-[0.65rem] font-mono text-[#5f6e6a] mt-0.5">
                    {modelName}
                  </p>
                )}
              </div>
              <TranscriptPanel output={output} />
            </div>
          );
        })}
        {displayProviders.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[0.78rem] text-[#5f6e6a]">
              Select providers to compare
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const TranscriptPanel: React.FC<{
  output:
    | {
        finalText: string;
        pendingText: string;
        error: string;
        status: string;
      }
    | undefined;
}> = ({ output }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output?.finalText, output?.pendingText]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3">
      {output?.error ? (
        <p className="text-[0.75rem] text-[#c45a4a] font-mono leading-relaxed">
          {output.error}
        </p>
      ) : output?.status ? (
        <p className="text-[0.75rem] text-[#5f6e6a] font-mono animate-pulse">
          {output.status}
        </p>
      ) : (
        <p className="text-[0.82rem] leading-relaxed text-[#e6edeb] font-mono whitespace-pre-wrap break-words">
          {output?.finalText}
          {output?.pendingText && (
            <span className="text-[#5f6e6a] italic">{output.pendingText}</span>
          )}
          {!output?.finalText && !output?.pendingText && (
            <span className="text-[#3a4440] text-[0.72rem]">
              Waiting for speech...
            </span>
          )}
        </p>
      )}
    </div>
  );
};
