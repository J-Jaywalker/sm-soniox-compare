import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { useComparison } from "@/contexts/comparison-context";
import { Button } from "../ui/button";
import { FileAudio } from "lucide-react";
import { useState } from "react";
import { ResponsiveTooltip } from "../ui/responsive-tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip";

const PREDEFINED_AUDIO_FILES: { id: string; name: string; url: string }[] = [
  {
    id: "coffee_shop.mp3",
    name: "Coffee shop (English)",
    url: "https://soniox.com/media/examples/coffee_shop.mp3",
  },
  {
    id: "stt_medical_2.mp3",
    name: "Clinical note (English)",
    url: "https://soniox.com/media/examples/stt_medical_2.mp3",
  },
  {
    id: "stt_it_en.mp3",
    name: "Multilingual (Italian & English)",
    url: "https://soniox.com/media/examples/stt_it_en.mp3",
  },
  {
    id: "mt_zh_en_one_way.mp3",
    name: "Podcast (Chinese & English)",
    url: "https://soniox.com/media/examples/mt_zh_en_one_way.mp3",
  },
  {
    id: "mt_es_en.mp3",
    name: "Street conversation (Spanish & English)",
    url: "https://soniox.com/media/examples/mt_es_en.mp3",
  },
  {
    id: "mt_en_tr_two_way.mp3",
    name: "Trip to Turkey (English & Turkish)",
    url: "https://soniox.com/media/examples/mt_en_tr_two_way.mp3",
  },
];

export const ChooseAudioFileDialog = ({ disabled }: { disabled?: boolean }) => {
  const { recordingState, setAudio, clearAudio } = useComparison();

  const isRecording = recordingState === "recording";
  const isStarting = recordingState === "starting";
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);

  const handleSelectPredefinedFile = async (url: string, name: string) => {
    setIsProcessingFile(true);
    clearAudio();
    setAudio(url, name);
    setIsFileDialogOpen(false);
    setIsProcessingFile(false);
  };

  return (
    <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
      <TooltipProvider>
        <ResponsiveTooltip content={<p>Select audio file</p>}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="border-soniox text-soniox hover:border-black"
              disabled={
                isRecording || isStarting || isProcessingFile || disabled
              }
              aria-label="Select audio file"
            >
              <FileAudio className="w-4 h-4" />
            </Button>
          </DialogTrigger>
        </ResponsiveTooltip>
      </TooltipProvider>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Audio Source</DialogTitle>
          <DialogDescription>
            Choose a pre-defined audio file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 w-full">
          <div className="space-y-2 w-full">
            <Label className="text-sm font-medium">
              Pre-defined Audio Files
            </Label>
            <div className="space-y-2">
              {PREDEFINED_AUDIO_FILES.map((file) => (
                <Button
                  key={file.id}
                  variant="ghost"
                  className="relative justify-start text-sm w-full h-10 bg-gray-100 hover:bg-gray-200"
                  onClick={() =>
                    handleSelectPredefinedFile(file.url, file.name)
                  }
                  disabled={isProcessingFile}
                >
                  <div className="absolute inset-0 flex items-center justify-start px-2">
                    <FileAudio className="w-4 h-4 mr-2 opacity-70" />
                    <span className="truncate">{file.name}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
