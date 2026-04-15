import { cn } from "@/lib/utils";
import { LayoutGrid, ListChecks, Mic, MicOff } from "lucide-react";
import React from "react";
import { type AudioRecordingState } from "@/contexts/comparison-context";

type ActiveView = "main" | "features";

interface BottomNavbarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onOpenSettings: () => void;
  recordingState: AudioRecordingState;
  stopRecording: () => void;
}

export const BottomNavbar: React.FC<BottomNavbarProps> = ({
  activeView,
  setActiveView,
  onOpenSettings,
  recordingState,
  stopRecording,
}) => {
  const isRecording = recordingState !== "idle";

  const navItems = [
    {
      id: "main",
      label: "Compare",
      icon: LayoutGrid,
      onClick: () => setActiveView("main"),
      active: activeView === "main",
    },
    {
      id: "features",
      label: "Features",
      icon: ListChecks,
      onClick: () => setActiveView("features"),
      active: activeView === "features",
    },
    {
      id: "settings",
      label: isRecording ? "Stop" : "Transcribe",
      icon: isRecording ? MicOff : Mic,
      onClick: isRecording
        ? () => {
            stopRecording();
            setActiveView("main");
          }
        : () => {
            onOpenSettings();
            setActiveView("main");
          },
      active: false, // This button opens a sheet, it doesn't represent a view
      isRecording,
    },
  ];

  return (
    <nav className="sticky bottom-0 left-0 right-0 bg-[#0d1110] border-t border-[#2e3330] md:hidden z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
              item.isRecording
                ? "text-red-400 hover:text-red-300"
                : item.active
                ? "text-soniox"
                : "text-[#5f6e6a] hover:text-[#b4c3be]"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
