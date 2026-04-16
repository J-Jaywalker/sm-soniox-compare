import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { type ProviderName } from "@/lib/provider-features";
import {
  useVideoTranscription,
  type VideoTranscriptOutputs,
  type VideoTranscriptionState,
} from "@/hooks/use-video-transcription";

interface VideoModeContextValue {
  activePage: "primary" | "secondary";
  setActivePage: (page: "primary" | "secondary") => void;
  videoPlayerOpen: boolean;
  setVideoPlayerOpen: (open: boolean) => void;
  isVideoMode: boolean;
  videoElRef: React.MutableRefObject<HTMLVideoElement | null>;
  transcriptionState: VideoTranscriptionState;
  transcriptionOutputs: VideoTranscriptOutputs;
  transcriptionActiveProviders: ProviderName[];
  startVideoTranscription: (urlParams: string, providers: ProviderName[]) => Promise<void>;
  stopVideoTranscription: (pauseVideo?: boolean) => void;
  cleanupVideoTranscription: () => void;
}

const VideoModeContext = createContext<VideoModeContextValue | null>(null);

export const VideoModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activePage, setActivePage] = useState<"primary" | "secondary">("primary");
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  const { state, outputs, activeProviders, start, stop, cleanup } =
    useVideoTranscription();

  const isVideoMode = activePage === "secondary" && videoPlayerOpen;

  const startVideoTranscription = useCallback(
    async (urlParams: string, providers: ProviderName[]) => {
      if (!videoElRef.current) return;
      await start(videoElRef.current, urlParams, providers);
    },
    [start]
  );

  const stopVideoTranscription = useCallback(
    (pauseVideo = true) => {
      stop(pauseVideo ? videoElRef.current : undefined);
    },
    [stop]
  );

  const value = useMemo<VideoModeContextValue>(
    () => ({
      activePage,
      setActivePage,
      videoPlayerOpen,
      setVideoPlayerOpen,
      isVideoMode,
      videoElRef,
      transcriptionState: state,
      transcriptionOutputs: outputs,
      transcriptionActiveProviders: activeProviders,
      startVideoTranscription,
      stopVideoTranscription,
      cleanupVideoTranscription: cleanup,
    }),
    [
      activePage,
      videoPlayerOpen,
      isVideoMode,
      state,
      outputs,
      activeProviders,
      startVideoTranscription,
      stopVideoTranscription,
      cleanup,
    ]
  );

  return (
    <VideoModeContext.Provider value={value}>
      {children}
    </VideoModeContext.Provider>
  );
};

export function useVideoMode() {
  const ctx = useContext(VideoModeContext);
  if (!ctx) throw new Error("useVideoMode must be used within VideoModeProvider");
  return ctx;
}
