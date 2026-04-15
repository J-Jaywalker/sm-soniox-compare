import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AudioEventType = "laughter" | "applause" | "music";

export const ALL_AUDIO_EVENT_TYPES: AudioEventType[] = [
  "laughter",
  "applause",
  "music",
];

const EVENT_OPTIONS: {
  type: AudioEventType;
  label: string;
  description: string;
}[] = [
  {
    type: "laughter",
    label: "Laughter",
    description: "Detect laughter and chuckling in the audio",
  },
  {
    type: "applause",
    label: "Applause",
    description: "Detect clapping and applause",
  },
  {
    type: "music",
    label: "Music",
    description: "Detect background music",
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Empty array = detect all types */
  initialTypes: AudioEventType[];
  onSave: (types: AudioEventType[]) => void;
}

export const AudioEventsDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  initialTypes,
  onSave,
}) => {
  const [selected, setSelected] = useState<Set<AudioEventType>>(
    new Set(ALL_AUDIO_EVENT_TYPES)
  );

  useEffect(() => {
    if (open) {
      // Empty initialTypes means "all" — show all checked
      setSelected(
        new Set(
          initialTypes.length === 0 ? ALL_AUDIO_EVENT_TYPES : initialTypes
        )
      );
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (type: AudioEventType) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const allSelected = selected.size === ALL_AUDIO_EVENT_TYPES.length;

  const handleSave = () => {
    // All selected = pass empty array (Speechmatics default = all types)
    const types = allSelected ? [] : (Array.from(selected) as AudioEventType[]);
    onSave(types);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="bg-[#161817] border-[#2e3330] text-[#e6edeb] max-w-md p-0 gap-0"
      >
        <DialogTitle className="sr-only">Audio Events</DialogTitle>
        <DialogDescription className="sr-only">
          Configure which audio events to detect
        </DialogDescription>

        <DialogClose asChild className="absolute -top-4.5 -right-4.5 z-10">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full bg-white shadow-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogClose>

        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2e3330]">
          <h2 className="text-sm font-semibold text-[#e6edeb]">Audio Events</h2>
          <p className="text-[0.72rem] text-[#5f6e6a] mt-0.5">
            Detect non-speech sounds during transcription.
          </p>
        </div>

        {/* Event rows */}
        <div className="px-6 py-4 space-y-2">
          {EVENT_OPTIONS.map(({ type, label, description }) => {
            const isChecked = selected.has(type);
            return (
              <button
                key={type}
                onClick={() => toggle(type)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 border rounded-[4px] text-left transition-all duration-150",
                  isChecked
                    ? "border-[#29a383]/40 bg-[#29a383]/8"
                    : "border-[#2e3330] hover:border-[#29a383]/25 hover:bg-[#29a383]/4"
                )}
              >
                {/* Custom checkbox dot */}
                <div
                  className={cn(
                    "w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 transition-all duration-150",
                    isChecked
                      ? "bg-[#29a383] border-[#29a383]"
                      : "bg-transparent border-[#37403e]"
                  )}
                >
                  {isChecked && (
                    <svg
                      width="9"
                      height="7"
                      viewBox="0 0 9 7"
                      fill="none"
                    >
                      <path
                        d="M1 3.5L3.5 6L8 1"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[0.82rem] font-medium text-[#e6edeb] leading-none mb-0.5">
                    {label}
                  </p>
                  <p className="text-[0.72rem] text-[#5f6e6a]">{description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2e3330] flex items-center justify-between gap-2">
          <button
            onClick={() =>
              setSelected(
                allSelected ? new Set() : new Set(ALL_AUDIO_EVENT_TYPES)
              )
            }
            className="text-[0.75rem] text-[#5f6e6a] hover:text-[#b4c3be] transition-colors"
          >
            {allSelected ? "Deselect all" : "Select all"}
          </button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#2e3330] bg-transparent text-[#b4c3be] hover:bg-[#2e3330] hover:text-[#e6edeb] text-[0.82rem]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={selected.size === 0}
              className="bg-[#29a383] hover:bg-[#29a383]/90 text-white text-[0.82rem] disabled:opacity-40"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
