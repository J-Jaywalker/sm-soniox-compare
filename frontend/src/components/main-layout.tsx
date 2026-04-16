import React, { useState, useEffect, useCallback } from "react";
import { Menu, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { BottomNavbar } from "./bottom-navbar";
import { VideoSection } from "./video-section";
import { useComparison } from "@/contexts/comparison-context";
import { useSwipe } from "@/hooks/use-swipe";
import { useVideoMode } from "@/contexts/video-mode-context";


interface MainLayoutProps {
  sidebarContent: React.ReactNode;
  mainContent: React.ReactNode;
  featureTableContent?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  sidebarContent,
  mainContent,
  featureTableContent,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<"main" | "features">("main");
  const [nearRightEdge, setNearRightEdge] = useState(false);
  const { activePage, setActivePage, transcriptionState, stopVideoTranscription } = useVideoMode();
  const [nearLeftEdge, setNearLeftEdge] = useState(false);

  const EDGE_THRESHOLD = 64;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    setNearRightEdge(relX >= rect.width - EDGE_THRESHOLD);
    setNearLeftEdge(relX <= EDGE_THRESHOLD);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setNearRightEdge(false);
    setNearLeftEdge(false);
  }, []);
  const { recordingState, stopRecording } = useComparison();

  const handleNavigateToPrimary = useCallback(() => {
    if (transcriptionState !== "idle") stopVideoTranscription(true);
    setActivePage("primary");
  }, [transcriptionState, stopVideoTranscription, setActivePage]);

  const swipeHandlers = useSwipe({
    onSwipeRight: () => {
      // Open sidebar with a swipe from the left edge of the screen
      if (activeView === "main" && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
    },
  });

  return (
    <div
      {...swipeHandlers}
      style={{ touchAction: "pan-y" }}
      className="w-full h-dvh flex flex-row font-sans antialiased bg-[#101211] text-[#e6edeb] overflow-hidden"
    >
      <Sidebar isSheetOpen={isSidebarOpen} setIsSheetOpen={setIsSidebarOpen}>
        {sidebarContent}
      </Sidebar>

      {/* Main content area */}
      <main
        className="flex-grow relative h-dvh flex flex-col overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >

        {/* Sliding panes */}
        <div className="flex-1 relative overflow-hidden">
          <div
            className="flex h-full transition-transform duration-500 ease-in-out"
            style={{
              width: "200%",
              transform: activePage === "primary" ? "translateX(0)" : "translateX(-50%)",
            }}
          >
            {/* Primary pane */}
            <div className="relative h-full shrink-0" style={{ width: "50%" }}>
              {activeView === "main" ? mainContent : featureTableContent}

              {/* Right-edge chevron — only visible when cursor is within EDGE_THRESHOLD of right edge */}
              <div
                className="absolute right-0 top-0 h-full w-16 flex items-center justify-center cursor-pointer z-20"
                onClick={() => setActivePage("secondary")}
              >
                <ChevronRight
                  className={cn(
                    "w-10 h-10 text-white/40 transition-all duration-200 ease-out drop-shadow-lg",
                    activePage === "primary" && nearRightEdge
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 translate-x-3 pointer-events-none"
                  )}
                />
              </div>
            </div>

            {/* Secondary pane — video gallery */}
            <div className="relative h-full shrink-0 bg-[#101211] overflow-y-auto" style={{ width: "50%" }}>
              <VideoSection />
              {/* Left-edge chevron — only visible when cursor is within EDGE_THRESHOLD of left edge */}
              <div
                className="absolute left-0 top-0 h-full w-16 flex items-center justify-center cursor-pointer z-20"
                onClick={handleNavigateToPrimary}
              >
                <ChevronLeft
                  className={cn(
                    "w-10 h-10 text-white/40 transition-all duration-200 ease-out drop-shadow-lg",
                    activePage === "secondary" && nearLeftEdge
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-3 pointer-events-none"
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navbar */}
        <BottomNavbar
          activeView={activeView}
          setActiveView={setActiveView}
          onOpenSettings={() => setIsSidebarOpen(true)}
          recordingState={recordingState}
          stopRecording={stopRecording}
        />
      </main>
    </div>
  );
};

interface SidebarProps {
  children: React.ReactNode;
  isSheetOpen: boolean;
  setIsSheetOpen: (isOpen: boolean) => void;
}
const Sidebar: React.FC<SidebarProps> = ({
  children,
  isSheetOpen,
  setIsSheetOpen,
}) => {
  const [shouldAnimate, setShouldAnimate] = useState(true);

  // This effect is used to prevent the sheet from animating when the window is resized and it automatically closes.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Tailwind's default lg breakpoint
        setShouldAnimate(false);
        setIsSheetOpen(false);
        setTimeout(() => {
          setShouldAnimate(true);
        }, 100);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsSheetOpen]);

  return (
    <>
      {/* Static Sidebar for larger screens */}
      <aside
        className={cn(
          "sticky shrink-0 top-0 h-screen w-72 flex-col border-r border-[#2e3330] bg-[#101211]",
          "hidden lg:flex"
        )}
      >
        {children}
      </aside>

      {/* Hamburger menu and Sheet for smaller screens */}
      <div className="hidden md:flex lg:hidden absolute top-3 left-0 z-20">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTitle hidden>Control Panel</SheetTitle>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="translate-x-3"
              size="icon"
              aria-label="Clear transcripts"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className={cn("w-72 p-0", !shouldAnimate && "!duration-0")}
            showCloseButton={false} // Assuming this prop exists as per your previous changes
          >
            <SheetDescription hidden>
              Settings for the comparison
            </SheetDescription>
            {children}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};
