import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

export interface VocabEntry {
  content: string;
  sounds_like: string[];
}

interface DraftEntry {
  id: string;
  content: string;
  soundsLike: string;
}

function vocabToDraft(vocab: VocabEntry[]): DraftEntry[] {
  return vocab.map((v, i) => ({
    id: `${i}-${v.content}`,
    content: v.content,
    soundsLike: v.sounds_like.join(", "),
  }));
}

function draftToVocab(draft: DraftEntry[]): VocabEntry[] {
  return draft
    .filter((d) => d.content.trim())
    .map((d) => {
      const entry: VocabEntry = { content: d.content.trim(), sounds_like: [] };
      if (d.soundsLike.trim()) {
        entry.sounds_like = d.soundsLike
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return entry;
    });
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEntries: VocabEntry[];
  onSave: (entries: VocabEntry[]) => void;
}

export const CustomDictionaryDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  initialEntries,
  onSave,
}) => {
  const [entries, setEntries] = useState<DraftEntry[]>([]);
  const contentRefs = useRef<(HTMLInputElement | null)[]>([]);
  const soundsLikeRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      const draft = vocabToDraft(initialEntries);
      setEntries(
        draft.length > 0
          ? draft
          : [{ id: Date.now().toString(), content: "", soundsLike: "" }]
      );
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const addEntry = (focusIndex?: number) => {
    const newId = Date.now().toString();
    setEntries((prev) => [...prev, { id: newId, content: "", soundsLike: "" }]);
    const idx = focusIndex ?? entries.length;
    setTimeout(() => {
      contentRefs.current[idx]?.focus();
    }, 50);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.id !== id);
      return filtered.length === 0
        ? [{ id: Date.now().toString(), content: "", soundsLike: "" }]
        : filtered;
    });
  };

  const updateEntry = (
    id: string,
    field: "content" | "soundsLike",
    value: string
  ) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleContentKeyDown = (
    e: React.KeyboardEvent,
    index: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      soundsLikeRefs.current[index]?.focus();
    }
  };

  const handleSoundsLikeKeyDown = (
    e: React.KeyboardEvent,
    index: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEntry(index + 1);
    }
  };

  const handleSave = () => {
    const vocab = draftToVocab(entries);
    onSave(vocab);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="bg-[#161817] border-[#2e3330] text-[#e6edeb] max-w-2xl p-0 gap-0"
      >
        <DialogTitle className="sr-only">Custom Dictionary</DialogTitle>
        <DialogDescription className="sr-only">
          Add words to improve transcription accuracy
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
          <h2 className="text-sm font-semibold text-[#e6edeb]">
            Custom Dictionary
          </h2>
          <p className="text-[0.72rem] text-[#5f6e6a] mt-0.5">
            Add words or phrases to improve transcription accuracy. Use{" "}
            <span className="text-[#b4c3be]">Sounds Like</span> for phonetic
            hints (comma-separated).
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[55vh] overflow-y-auto">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_1fr_2rem] gap-2 mb-2 px-1">
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#5f6e6a]">
              Word / Phrase
            </span>
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#5f6e6a]">
              Sounds Like{" "}
              <span className="normal-case font-normal text-[#3d4845]">
                optional
              </span>
            </span>
            <div />
          </div>

          <div className="space-y-2">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="grid grid-cols-[1fr_1fr_2rem] gap-2 items-center"
              >
                <input
                  ref={(el) => {
                    contentRefs.current[index] = el;
                  }}
                  value={entry.content}
                  onChange={(e) =>
                    updateEntry(entry.id, "content", e.target.value)
                  }
                  onKeyDown={(e) => handleContentKeyDown(e, index)}
                  placeholder="e.g. gnocchi"
                  className="bg-[#1e201f] border border-[#2e3330] rounded-[4px] px-3 py-2 text-[0.82rem] text-[#e6edeb] placeholder:text-[#3d4845] focus:outline-none focus:border-[#29a383]/60 transition-colors"
                />
                <input
                  ref={(el) => {
                    soundsLikeRefs.current[index] = el;
                  }}
                  value={entry.soundsLike}
                  onChange={(e) =>
                    updateEntry(entry.id, "soundsLike", e.target.value)
                  }
                  onKeyDown={(e) => handleSoundsLikeKeyDown(e, index)}
                  placeholder="e.g. nyohki, nokey"
                  className="bg-[#1e201f] border border-[#2e3330] rounded-[4px] px-3 py-2 text-[0.82rem] text-[#e6edeb] placeholder:text-[#3d4845] focus:outline-none focus:border-[#29a383]/60 transition-colors"
                />
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="h-8 w-8 flex items-center justify-center rounded-[4px] text-[#5f6e6a] hover:text-[#e6edeb] hover:bg-[#2e3330] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => addEntry(entries.length)}
            className="mt-3 flex items-center gap-1.5 text-[0.78rem] text-[#5f6e6a] hover:text-[#29a383] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add word
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2e3330] flex items-center justify-between gap-2">
          <button
            onClick={() =>
              setEntries([{ id: Date.now().toString(), content: "", soundsLike: "" }])
            }
            className="text-[0.75rem] text-[#5f6e6a] hover:text-red-400 transition-colors"
          >
            Clear all
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
              className="bg-[#29a383] hover:bg-[#29a383]/90 text-white text-[0.82rem]"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
