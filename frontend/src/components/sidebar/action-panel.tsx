import { Button } from "@/components/ui/button";
import { PlayCircle, StopCircle, XIcon, Play, Pause, Mic } from "lucide-react";
import { useComparison } from "@/contexts/comparison-context"; // Assuming this type is exported
import { ChooseAudioFileDialog } from "./audio-picker";
import { useState, useEffect, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { AudioWaveButton } from "../audio-wave-button";
import { useUrlSettings } from "@/hooks/use-url-settings";

export const ActionPanel = () => {
  const { isValid } = useUrlSettings();
  const {
    recordingState,
    startRecording,
    stopRecording,
    selectedAudioFileName,
    clearAudio,
    audioReady,
  } = useComparison();
  const isRecording = recordingState === "recording";
  const isStarting = recordingState === "starting";
  const isStopping = recordingState === "stopping";
  const isConnecting = recordingState === "connecting";

  const hasAudioFile = !!selectedAudioFileName;

  return (
    <div className="w-full flex flex-col gap-2 p-4 border-t border-[#1e201f] bg-[#0d1110]">
      <div className="flex gap-2">
        <AudioWaveButton
          onClick={
            isRecording
              ? stopRecording
              : hasAudioFile && audioReady
              ? startRecording
              : !hasAudioFile
              ? startRecording
              : () => {}
          }
          variant={isRecording ? "destructive" : "default"}
          className={`flex-1 ${isRecording ? "" : "bg-soniox"}`}
          disabled={
            !isValid ||
            isStarting ||
            isStopping ||
            (hasAudioFile && !audioReady && !isRecording)
          }
        >
          {isRecording ? (
            <div className="flex flex-row items-center gap-x-2">
              <StopCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isConnecting ? "Connecting..." : isStarting ? "Starting..." : "Stop"}
              </span>
            </div>
          ) : hasAudioFile ? (
            <div className="flex flex-row items-center gap-x-2">
              <PlayCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {audioReady ? "Play file" : "Loading..."}
              </span>
            </div>
          ) : (
            <div className="flex flex-row items-center gap-x-2">
              <Mic className="w-4 h-4" />
              <span className="text-sm font-medium">Start talking</span>
            </div>
          )}
        </AudioWaveButton>
        <ChooseAudioFileDialog disabled={hasAudioFile} />
      </div>
      {hasAudioFile && (
        <div className="flex items-center justify-between gap-2">
          <span
            className="truncate text-[0.72rem] text-[#5f6e6a] font-mono"
            title={selectedAudioFileName}
          >
            {selectedAudioFileName}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearAudio}
            className="h-5 w-5 shrink-0 text-[#5f6e6a] hover:text-[#e6edeb] hover:bg-transparent"
            aria-label="Clear selected audio file"
            disabled={isRecording || isStarting || isStopping || isConnecting}
          >
            <XIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
      <AudioFileControls />
    </div>
  );
};

const formatTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

const AudioFileControls = () => {
  const { isValid } = useUrlSettings();
  const {
    audioRef,
    recordingState,
    selectedAudioFileName,
    audioReady,
    startRecording, // To initiate playback of the audio file
    //stopRecording, // To stop playback
  } = useComparison();

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handlePlay = () => setIsAudioPlaying(true);
    const handlePause = () => setIsAudioPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audioElement.currentTime);
    const handleLoadedMetadata = () => setDuration(audioElement.duration);
    const handleEnded = () => {
      setIsAudioPlaying(false);
      // If stopRecording is intended to reset state after file ends, call it here
      // For now, just set playing to false. startRecording handles actual playback start.
      if (recordingState === "recording") {
        // This indicates the file played through while in "recording" (playback) mode
        // We might want to call stopRecording() to transition state properly
        // However, startRecording in the context handles the actual audio playback
        // and its stop is tied to wsRef.current.send("END") etc.
        // For pure file playback, this might need refinement in how context's stopRecording works.
      }
    };

    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", handlePause);
    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioElement.addEventListener("ended", handleEnded);

    // Initial state sync
    if (audioElement.duration) setDuration(audioElement.duration);
    setCurrentTime(audioElement.currentTime);
    setIsAudioPlaying(!audioElement.paused);

    return () => {
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.removeEventListener("ended", handleEnded);
    };
  }, [audioRef, selectedAudioFileName, audioReady, recordingState]);

  // Sync with overall recordingState from context
  useEffect(() => {
    if (recordingState === "recording" && selectedAudioFileName && audioReady) {
      setIsAudioPlaying(true);
    } else if (recordingState === "idle" || recordingState === "stopping") {
      setIsAudioPlaying(false);
      if (
        audioRef.current &&
        recordingState === "idle" &&
        selectedAudioFileName
      ) {
        // Reset time if playback stopped externally and it's not due to file ending
        // setCurrentTime(0); // This might be too aggressive if user manually pauses.
      }
    }
  }, [recordingState, selectedAudioFileName, audioReady, audioRef]);

  const handleTogglePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (recordingState !== "recording") {
      if (selectedAudioFileName && audioReady) {
        startRecording();
      }
    } else {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [
    audioRef,
    recordingState,
    selectedAudioFileName,
    audioReady,
    startRecording,
  ]);

  const handleSeek = (value: number[]) => {
    if (audioRef.current && audioReady && duration > 0) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  if (!selectedAudioFileName) {
    return null;
  }

  // Determine the effective playing state for the button icon
  // isAudioPlaying is from the audio element's events
  // recordingState === "recording" is from the context
  const displayAsPlaying =
    (recordingState === "recording" || isAudioPlaying) &&
    selectedAudioFileName &&
    audioReady &&
    audioRef.current &&
    !audioRef.current.paused;

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-[#1d201f] border border-[#2e3330] rounded-[4px]">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleTogglePlayPause}
        disabled={
          !isValid ||
          !audioReady ||
          recordingState === "starting" ||
          recordingState === "stopping" ||
          recordingState === "connecting"
        }
        className="h-7 w-7 text-[#b4c3be] hover:text-[#e6edeb] hover:bg-transparent shrink-0"
        aria-label={displayAsPlaying ? "Pause audio file" : "Play audio file"}
      >
        {displayAsPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>
      <Slider
        value={[currentTime]}
        max={duration}
        step={1}
        className="flex-1 h-1 data-[disabled]:opacity-30"
        onValueChange={handleSeek}
        disabled={
          !audioReady ||
          duration === 0 ||
          recordingState === "starting" ||
          recordingState === "stopping" ||
          recordingState === "connecting"
        }
        aria-label="Audio seek bar"
      />
      <div className="text-[0.68rem] font-mono text-[#5f6e6a] shrink-0 tabular-nums">
        {formatTime(currentTime)}<span className="opacity-50"> / </span>{formatTime(duration)}
      </div>
    </div>
  );
};
