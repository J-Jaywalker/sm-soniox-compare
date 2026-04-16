import { StopCircle, Mic, Video } from "lucide-react";
import { useComparison } from "@/contexts/comparison-context";
import { AudioWaveButton } from "../audio-wave-button";
import { useUrlSettings } from "@/hooks/use-url-settings";
import { useVideoMode } from "@/contexts/video-mode-context";
import { PRIMARY_PROVIDER } from "@/lib/provider-features";
import type { ProviderName } from "@/lib/provider-features";

export const ActionPanel = () => {
  const { isValid, settings, getSettingsAsUrlParams } = useUrlSettings();
  const {
    recordingState,
    startRecording,
    stopRecording,
  } = useComparison();
  const {
    isVideoMode,
    transcriptionState,
    startVideoTranscription,
    stopVideoTranscription,
  } = useVideoMode();

  // Mic recording state
  const isRecording = recordingState === "recording";
  const isStarting = recordingState === "starting";
  const isStopping = recordingState === "stopping";
  const isConnecting = recordingState === "connecting";

  // Video transcription state
  const isVideoTranscribing = transcriptionState !== "idle";
  const isVideoConnecting = transcriptionState === "connecting";

  const handleStartVideo = async () => {
    const allProviders: ProviderName[] = [
      PRIMARY_PROVIDER,
      ...settings.selectedProviders.filter((p) => p !== PRIMARY_PROVIDER),
    ];
    await startVideoTranscription(getSettingsAsUrlParams(), allProviders);
  };

  if (isVideoMode) {
    return (
      <div className="w-full flex flex-col gap-2 p-4 border-t border-[#1e201f] bg-[#0d1110]">
        <div className="flex gap-2">
          <AudioWaveButton
            onClick={isVideoTranscribing ? () => stopVideoTranscription(true) : handleStartVideo}
            variant={isVideoTranscribing ? "destructive" : "default"}
            className={`flex-1 ${isVideoTranscribing ? "" : "bg-soniox"}`}
            disabled={!isValid}
          >
            {isVideoTranscribing ? (
              <div className="flex flex-row items-center gap-x-2">
                <StopCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isVideoConnecting ? "Connecting..." : "Stop"}
                </span>
              </div>
            ) : (
              <div className="flex flex-row items-center gap-x-2">
                <Video className="w-4 h-4" />
                <span className="text-sm font-medium">Transcribe video</span>
              </div>
            )}
          </AudioWaveButton>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2 p-4 border-t border-[#1e201f] bg-[#0d1110]">
      <div className="flex gap-2">
        <AudioWaveButton
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? "destructive" : "default"}
          className={`flex-1 ${isRecording ? "" : "bg-soniox"}`}
          disabled={!isValid || isStarting || isStopping}
        >
          {isRecording ? (
            <div className="flex flex-row items-center gap-x-2">
              <StopCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isConnecting ? "Connecting..." : isStarting ? "Starting..." : "Stop"}
              </span>
            </div>
          ) : (
            <div className="flex flex-row items-center gap-x-2">
              <Mic className="w-4 h-4" />
              <span className="text-sm font-medium">Start talking</span>
            </div>
          )}
        </AudioWaveButton>
      </div>
    </div>
  );
};
