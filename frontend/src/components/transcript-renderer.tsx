import type { OutputData, TranscriptPart } from "@/contexts/comparison-context";
import { cn } from "@/lib/utils";
import React, { memo } from "react";
import { AutoScrollContainer } from "./ui/autoscroll";
import { TooltipProvider } from "@/components/ui/tooltip";
import MarkdownRenderer from "./markdown-renderer";
import { ResponsiveTooltip } from "./ui/responsive-tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";

export const SPEAKER_COLORS = [
  "#007ecc", // Blue
  "#5aa155", // Green
  "#e0585b", // Red
  "#f18f3b", // Orange
  "#77b7b2", // Teal
  "#edc958", // Yellow
  "#af7aa0", // Purple
  "#fe9ea8", // Pink
  "#9c7561", // Brown
  "#bab0ac", // Gray
  "#8884d8", // Light Purple
  "#82ca9d", // Light Green
  "#ff7f0e", // Vivid Orange
  "#1f77b4", // Ocean Blue
  "#d62728", // Crimson
  "#9467bd", // Lavender
  "#8c564b", // Reddish Brown
  "#e377c2", // Magenta
  "#7f7f7f", // Neutral Gray
  "#bcbd22", // Lime
  "#17becf", // Cyan
  "#aec7e8", // Light Blue
  "#c5b0d5", // Soft Purple
  "#ffbb78", // Soft Orange
  "#98df8a", // Soft Green
];

interface TranscriptRendererProps {
  outputData: OutputData;
  appError?: string | null;
}

export const TranscriptRenderer: React.FC<TranscriptRendererProps> = ({
  outputData,
  appError,
}) => {
  const { statusMessage, finalParts, nonFinalParts, error } = outputData;

  const renderParts = (
    parts: TranscriptPart[],
    isFinalStyling: boolean,
    previousPartSpeaker?: number | string | null,
    previousPartLanguage?: string | null,
    previousPartTranslationStatus?: string | null,
    keyPrefix?: string
  ) => {
    const elementsArray: React.ReactNode[] = [];

    parts.forEach((part, index) => {
      // Audio event block header — rendered like a speaker change, not inline
      const audioEventMatch = part.text.trim().match(/^\[(\w+)\]$/);
      if (audioEventMatch) {
        const eventLabel = audioEventMatch[1];
        elementsArray.push(
          <div
            key={`${keyPrefix}-audio-event-${index}`}
            className="mt-3 mb-0.5"
          >
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#5f6e6a]">
              Audio Event:{" "}
              <span className="text-[#b4c3be]">
                {eventLabel.charAt(0).toUpperCase() + eventLabel.slice(1)}
              </span>
            </span>
          </div>
        );
        previousPartSpeaker = null; // force speaker re-display after an event
        return;
      }

      const partSpeaker = part.speaker || null;
      const partLanguage = part.language || null;
      const partTranslationStatus = part.translation_status || null;

      let displaySpeakerName = false;
      let displayLanguageTag = false;

      if (partSpeaker && partSpeaker !== previousPartSpeaker) {
        displaySpeakerName = true;
      }

      // This logic remains to track *when* a language tag should be shown
      if (partLanguage) {
        if (displaySpeakerName) {
          displayLanguageTag = true;
        } else if (partLanguage !== previousPartLanguage) {
          displayLanguageTag = true;
        }
      }

      let headerWasDrawnThisIteration = false;
      if (displaySpeakerName) {
        const headerDivColor =
          SPEAKER_COLORS[(Number(partSpeaker) - 1) % SPEAKER_COLORS.length];

        elementsArray.push(
          <div
            key={`${keyPrefix}-header-${index}`}
            className="mt-3 text-base"
            style={{ color: headerDivColor }}
          >
            <span key="spk-name" className="font-semibold uppercase text-sm">
              SPEAKER {partSpeaker}
            </span>
          </div>
        );
        headerWasDrawnThisIteration = true;
      }

      const textToRender = headerWasDrawnThisIteration
        ? part.text.trimStart()
        : part.text;

      elementsArray.push(
        <WordToken
          key={`${keyPrefix}-part-${index}`}
          part={part}
          isFinalStyling={isFinalStyling}
          textToRender={textToRender}
          displayedLanguage={
            partLanguage !== previousPartLanguage && displayLanguageTag
              ? partLanguage
              : null
          }
          onNewLine={
            partLanguage !== previousPartLanguage &&
            !displaySpeakerName &&
            Boolean(previousPartLanguage)
          }
          addSpacing={
            partTranslationStatus !== previousPartTranslationStatus &&
            previousPartTranslationStatus === "translation" &&
            !displaySpeakerName
          }
        />
      );

      previousPartSpeaker = partSpeaker;
      previousPartLanguage = partLanguage;
      previousPartTranslationStatus = partTranslationStatus;
    });

    return {
      elements: elementsArray,
      newLastSpeaker: previousPartSpeaker,
      newLastLanguage: previousPartLanguage,
      newLastTranslationStatus: previousPartTranslationStatus,
    };
  };

  let content = null;

  if (appError) {
    content = <ErrorMessage error={appError} />;
    // } else if (error) {
    //   content = <ErrorMessage error={error} />;
  } else if (statusMessage) {
    content = <p className="text-[#5f6e6a] italic text-sm">{statusMessage}</p>;
  } else if (finalParts.length === 0 && nonFinalParts.length === 0 && !error) {
    content = <p className="text-[#37403e] italic text-sm">No output yet...</p>;
  } else {
    const finalRender = renderParts(
      finalParts,
      true,
      undefined,
      undefined,
      undefined,
      "final"
    );
    let combinedElements: React.ReactNode[] = [...finalRender.elements];

    if (nonFinalParts.length > 0) {
      const nonFinalRender = renderParts(
        nonFinalParts,
        false,
        finalRender.newLastSpeaker,
        finalRender.newLastLanguage,
        finalRender.newLastTranslationStatus,
        "nonfinal"
      );
      combinedElements = [...combinedElements, ...nonFinalRender.elements];
    }
    content = <>{combinedElements}</>;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <AutoScrollContainer className="absolute inset-0 pb-5">
        {content}
      </AutoScrollContainer>
    </TooltipProvider>
  );
};

const MAX_ERROR_LENGTH = 150;

const ErrorMessage = ({ error }: { error: string }) => {
  if (error.length <= MAX_ERROR_LENGTH) {
    return (
      <div className="text-red-400 bg-red-950/30 border border-red-900/40 p-3 md:p-4 absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 text-center text-sm rounded-[4px] max-w-[90%]">
        <MarkdownRenderer>{error}</MarkdownRenderer>
      </div>
    );
  }

  const truncatedError = error.substring(0, MAX_ERROR_LENGTH) + "...";

  return (
    <Dialog>
      <div className="text-red-400 bg-red-950/30 border border-red-900/40 p-3 md:p-4 absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 text-center text-sm rounded-[4px] max-w-[90%] space-y-2">
        <MarkdownRenderer>{truncatedError}</MarkdownRenderer>
        <DialogTrigger asChild>
          <Button size="sm" variant="link" className="text-[#b4c3be] p-0 h-auto">
            View Full Error
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="max-w-[90vw] md:max-w-3xl max-h-[80vh] bg-[#1d201f] border-[#2e3330]">
        <DialogHeader>
          <DialogTitle className="text-[#e6edeb]">Error Details</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto">
          <pre className="text-sm text-left bg-[#101211] text-[#b4c3be] p-4 rounded-[4px] whitespace-pre-wrap break-words font-mono">
            <code>{error}</code>
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const formatTime = (milliseconds: number): string => {
  if (typeof milliseconds !== "number" || isNaN(milliseconds)) return "";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  const remainingMs = Math.floor(milliseconds % 1000);
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}.${remainingMs.toString().padStart(3, "0")}`;
};

interface WordTokenProps {
  part: TranscriptPart;
  isFinalStyling: boolean;
  textToRender: string;
  displayedLanguage: string | null;
  onNewLine: boolean;
  addSpacing: boolean;
}

const WordToken = memo(
  ({
    part,
    isFinalStyling,
    textToRender,
    displayedLanguage,
    onNewLine,
    addSpacing,
  }: WordTokenProps) => {
    // --- 1. Special rendering for <end> tag ---
    if (part.text.trim() === "<end>") {
      const endTooltipParts: string[] = [];
      if (part.start_ms !== undefined && part.start_ms !== null) {
        endTooltipParts.push(
          `Endpoint detected at: ${formatTime(part.start_ms)}`
        );
      }

      return (
        <ResponsiveTooltip
          content={
            endTooltipParts.length > 0 && (
              <>
                {endTooltipParts.map((info, idx) => (
                  <p key={idx}>{info}</p>
                ))}
              </>
            )
          }
        >
          <span
            className={cn(
              "px-2 py-0.5 text-[#37403e] rounded text-[10px] font-mono tracking-wider border border-[#2e3330]",
              isFinalStyling ? "opacity-60" : "opacity-40"
            )}
          >
            {`<end>`}
          </span>
        </ResponsiveTooltip>
      );
    }

    // --- 2. Regular rendering for words ---
    const titleParts: string[] = [];
    if (part.start_ms !== undefined && part.start_ms !== null)
      titleParts.push(`Start: ${formatTime(part.start_ms)}`);
    if (part.end_ms !== undefined && part.end_ms !== null)
      titleParts.push(`End: ${formatTime(part.end_ms)}`);
    if (part.confidence !== undefined && part.confidence !== null)
      titleParts.push(`Confidence: ${part.confidence.toFixed(2)}`);

    const textClassName = isFinalStyling
      ? "text-[#e6edeb]"
      : "text-[#5f6e6a] italic";

    const languageTag = displayedLanguage ? (
      <>
        {onNewLine && <br />}
        {addSpacing && <div className="h-3" />}
        <span className="px-2 mr-0.5 py-0.5 bg-[#1d201f] border border-[#2e3330] text-[#b4c3be] rounded text-[0.68rem] font-medium">
          {new Intl.DisplayNames(["en"], { type: "language" }).of(
            displayedLanguage
          ) || displayedLanguage}
        </span>
      </>
    ) : null;

    return (
      <>
        {languageTag}
        <ResponsiveTooltip
          content={
            titleParts.length > 0 && (
              <div>
                {titleParts.map((info, idx) => (
                  <p key={idx}>{info}</p>
                ))}
              </div>
            )
          }
        >
          <span
            className={cn(
              textClassName,
              part.translation_status === "translation" &&
                "text-[#5f6e6a] text-sm italic",
              "hover:text-soniox rounded"
            )}
          >
            {textToRender}
          </span>
        </ResponsiveTooltip>
      </>
    );
  }
);

WordToken.displayName = "WordToken";
