import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";

interface StoredSpeaker {
  id: string;
  label: string;
  identifiers: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManageSpeakersDialog: React.FC<Props> = ({
  open,
  onOpenChange,
}) => {
  const [speakers, setSpeakers] = useState<StoredSpeaker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      fetch("/compare/api/speakers")
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to load speakers: ${res.statusText}`);
          return res.json();
        })
        .then((data) => {
          setSpeakers(data.speakers || []);
        })
        .catch((err) => {
          const message =
            err instanceof Error ? err.message : "Failed to load speakers.";
          setError(message);
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/compare/api/speakers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(`Failed to delete speaker: ${res.statusText}`);
      }
      setSpeakers((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete speaker.";
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="bg-[#161817] border-[#2e3330] text-[#e6edeb] max-w-md p-0 gap-0"
      >
        <DialogTitle className="sr-only">Manage Speakers</DialogTitle>
        <DialogDescription className="sr-only">
          View and manage enrolled speakers
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
            Manage Speakers
          </h2>
          <p className="text-[0.72rem] text-[#5f6e6a] mt-0.5">
            View and remove enrolled speakers.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[55vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-[#29a383] animate-spin" />
            </div>
          )}

          {error && (
            <p className="text-[0.82rem] text-red-400 py-2">{error}</p>
          )}

          {!loading && !error && speakers.length === 0 && (
            <p className="text-[0.82rem] text-[#5f6e6a] py-4 text-center">
              No speakers enrolled yet.
            </p>
          )}

          {!loading && speakers.length > 0 && (
            <div className="space-y-2">
              {speakers.map((speaker) => (
                <div
                  key={speaker.id}
                  className="flex items-center gap-3 px-3 py-2.5 border border-[#2e3330] rounded-[4px]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.82rem] font-medium text-[#e6edeb] truncate">
                      {speaker.label}
                    </p>
                    <p className="text-[0.68rem] text-[#5f6e6a]">
                      {speaker.identifiers.length} identifier
                      {speaker.identifiers.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(speaker.id)}
                    disabled={deletingId === speaker.id}
                    className="h-7 w-7 flex items-center justify-center rounded-[4px] text-[#5f6e6a] hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                  >
                    {deletingId === speaker.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2e3330] flex items-center justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#2e3330] bg-transparent text-[#b4c3be] hover:bg-[#2e3330] hover:text-[#e6edeb] text-[0.82rem]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
