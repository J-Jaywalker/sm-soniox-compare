import React, { useRef, useEffect, useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUrlSettings } from "@/hooks/use-url-settings";
import { PRIMARY_PROVIDER, type ProviderName } from "@/lib/provider-features";
import { useFeatures } from "@/contexts/feature-context";
import { useVideoMode } from "@/contexts/video-mode-context";
import { computeDiff, tokenize, type DiffGroup } from "@/lib/wer-diff";

interface Video {
  id: string;
  name: string;
  url: string;
  refUrl?: string;
}

interface RefEntry {
  content: string;
  start_time: string;
  end_time: string;
  speaker: string;
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
    resetVideoTranscription,
    cleanupVideoTranscription,
  } = useVideoMode();

  // Fetch reference transcript words
  const [refWords, setRefWords] = useState<string[] | undefined>(undefined);
  useEffect(() => {
    setRefWords(undefined);
    if (!video.refUrl) return;
    let cancelled = false;
    fetch(video.refUrl)
      .then((r) => r.json())
      .then((data: { reference: RefEntry[] }) => {
        if (!cancelled) {
          setRefWords(data.reference.map((e) => e.content));
        }
      })
      .catch(() => {
        if (!cancelled) setRefWords(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [video.refUrl]);

  const allProviders: ProviderName[] = [
    PRIMARY_PROVIDER,
    ...settings.selectedProviders.filter((p) => p !== PRIMARY_PROVIDER),
  ];
  const isTranscribing = transcriptionState !== "idle";
  const displayProviders = isTranscribing
    ? transcriptionActiveProviders
    : allProviders;

  // Register this video element in the shared context
  useEffect(() => {
    videoElRef.current = videoRef.current;
    return () => {
      videoElRef.current = null;
    };
  }, [videoElRef]);

  // Stop transcription when video ends
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
    resetVideoTranscription();
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
        {/* Spacer to keep title centred */}
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
          const subtitle =
            provider === "speechmatics"
              ? `realtime-${settings.operatingPoint}`
              : (providerFeatures?.[provider]?.model as string | undefined);
          return (
            <div
              key={provider}
              className={cn(
                "flex-1 flex flex-col min-w-0",
                i > 0 && "border-l border-[#2e3330]"
              )}
            >
              <div className="shrink-0 py-2 px-3 border-b border-[#2e3330] bg-[#1d201f] text-center">
                <p
                  className={cn(
                    "text-[0.78rem] font-semibold capitalize",
                    provider === PRIMARY_PROVIDER
                      ? "text-soniox"
                      : "text-[#e6edeb]"
                  )}
                >
                  {provider}
                </p>
                {subtitle && (
                  <p className="text-[0.65rem] font-mono text-[#5f6e6a] mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
              <TranscriptPanel
                output={output}
                refWords={refWords}
              />
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

// ── Transcript panel ──────────────────────────────────────────────────────────

const TranscriptPanel: React.FC<{
  output:
    | {
        finalText: string;
        pendingText: string;
        error: string;
        status: string;
      }
    | undefined;
  refWords: string[] | undefined;
}> = ({ output, refWords }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output?.finalText, output?.pendingText]);

  const hasFinalText = Boolean(output?.finalText?.trim());
  const hasRef = refWords && refWords.length > 0;

  // Compute diff only when we have both reference words and final text
  const diff = useMemo(() => {
    if (!hasRef || !hasFinalText) return null;
    const hypWords = tokenize(output!.finalText);
    return computeDiff(refWords!, hypWords);
  }, [hasRef, hasFinalText, refWords, output?.finalText]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3">
      {/* Error / connecting status */}
      {output?.error ? (
        <p className="text-[0.75rem] text-[#c45a4a] font-mono leading-relaxed">
          {output.error}
        </p>
      ) : output?.status ? (
        <p className="text-[0.75rem] text-[#5f6e6a] font-mono animate-pulse">
          {output.status}
        </p>
      ) : !output && !hasRef ? (
        <p className="text-[#3a4440] text-[0.72rem] font-mono">
          Waiting for speech...
        </p>
      ) : null}

      {/* SID diff — main output once we have final text and a reference */}
      {diff && (
        <SidDiff
          nSub={diff.nSub}
          nIns={diff.nIns}
          nDel={diff.nDel}
          wer={diff.wer}
          groups={diff.groups}
        />
      )}

      {/* Pending text shown below the diff (still-forming current phrase) */}
      {output?.pendingText && !output?.error && (
        <p className="text-[0.75rem] text-[#5f6e6a] italic font-mono mt-2">
          {output.pendingText}
        </p>
      )}

    </div>
  );
};

// ── SID diff component ────────────────────────────────────────────────────────

const SidDiff: React.FC<{
  nSub: number;
  nIns: number;
  nDel: number;
  wer: number;
  groups: DiffGroup[];
}> = ({ nSub, nIns, nDel, wer, groups }) => {
  const nErrors = nSub + nIns + nDel;
  const werPct = (wer * 100).toFixed(1);

  // Dark-mode Radix scale approximations used throughout
  // amber:  bg=#1c1707  border=#56440f  text=#f8b51b
  // jade:   bg=#111c18  border=#1c5641  text=#29d49a
  // orange: bg=#1f1200  border=#5f3311  text=#f5a162
  // sage:   bg=#161817  border=#2e3330  text=#8da39d

  return (
    <div className="border border-[#2e3330] rounded-[3px] overflow-hidden text-[0.75rem] font-mono">
      {/* Stats chips + WER — single row */}
      <div className="px-3 py-2 border-b border-[#2e3330] bg-[#161817] flex flex-wrap gap-1.5 items-center">
        {nErrors === 0 ? (
          <span className="px-1.5 py-0.5 rounded-[2px] bg-[#111c18] text-[#29d49a] border border-[#1c5641] text-[0.65rem] font-bold uppercase tracking-[0.06em]">
            Perfect match
          </span>
        ) : (
          <>
            {/* Substitutions — amber */}
            <span className="px-1.5 py-0.5 rounded-[2px] bg-[#1c1707] text-[#f8b51b] border border-[#56440f] text-[0.65rem]">
              Sub: <strong>{nSub}</strong>
            </span>
            {/* Insertions — jade */}
            <span className="px-1.5 py-0.5 rounded-[2px] bg-[#111c18] text-[#29d49a] border border-[#1c5641] text-[0.65rem]">
              Ins: <strong>{nIns}</strong>
            </span>
            {/* Deletions — orange */}
            <span className="px-1.5 py-0.5 rounded-[2px] bg-[#1f1200] text-[#f5a162] border border-[#5f3311] text-[0.65rem]">
              Del: <strong>{nDel}</strong>
            </span>
            {/* WER — neutral sage, pushed to the right */}
            <span className="ml-auto px-1.5 py-0.5 rounded-[2px] bg-[#1d201f] text-[#8da39d] border border-[#2e3330] text-[0.65rem]">
              WER: <strong>{werPct}%</strong>
            </span>
          </>
        )}
      </div>

      {/* Diff body */}
      <div className="px-3 py-2 bg-[#101211] leading-[1.9] break-words text-[#e6edeb]">
        {groups.map((g, i) => {
          if (g.type === "equal") {
            return <span key={i}>{g.word} </span>;
          }
          if (g.type === "delete") {
            return (
              <React.Fragment key={i}>
                <span className="line-through px-[2px] rounded-[2px] bg-[#1f1200] text-[#f5a162] border border-[#5f3311]">
                  {g.word}
                </span>{" "}
              </React.Fragment>
            );
          }
          if (g.type === "insert") {
            return (
              <React.Fragment key={i}>
                <span className="px-[2px] rounded-[2px] bg-[#111c18] text-[#29d49a] border border-[#1c5641]">
                  +{g.word}
                </span>{" "}
              </React.Fragment>
            );
          }
          // sub: ~~refWord~~ → hypWord
          return (
            <React.Fragment key={i}>
              <span className="line-through px-[2px] rounded-[2px] bg-[#1c1707] text-[#f8b51b] border border-[#56440f]">
                {g.refWord}
              </span>
              <span className="text-[#5f6e6a] mx-0.5">→</span>
              <span className="px-[2px] rounded-[2px] bg-[#1c1707] text-[#f8b51b] border border-[#56440f]">
                {g.hypWord}
              </span>{" "}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
