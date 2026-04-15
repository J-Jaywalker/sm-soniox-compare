import { StopCircle, Mic } from "lucide-react";
import { useComparison } from "@/contexts/comparison-context";
import { AudioWaveButton } from "../audio-wave-button";
import { useUrlSettings } from "@/hooks/use-url-settings";

export const ActionPanel = () => {
  const { isValid } = useUrlSettings();
  const {
    recordingState,
    startRecording,
    stopRecording,
  } = useComparison();
  const isRecording = recordingState === "recording";
  const isStarting = recordingState === "starting";
  const isStopping = recordingState === "stopping";
  const isConnecting = recordingState === "connecting";

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
