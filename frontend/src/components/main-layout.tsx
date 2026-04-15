import React, { useState, useEffect } from "react";
import { Menu } from "lucide-react";
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
import { useComparison } from "@/contexts/comparison-context";
import { useSwipe } from "@/hooks/use-swipe";


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
  const { recordingState, stopRecording } = useComparison();

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
      <main className="flex-grow relative h-dvh flex flex-col">
        <div className="w-full flex-1">
          {activeView === "main" ? mainContent : featureTableContent}
        </div>

        {/* Desktop FAB */}
        {/* Feature table moved to dialog (triggered from sidebar), 
        could reuse this for something else maybe */}
        {/* <div className="fixed bottom-6 right-6 hidden md:flex flex-col items-center gap-3 z-50">
          <button
            onClick={() =>
              setActiveView(activeView === "main" ? "features" : "main")
            }
            className="p-3 cursor-pointer rounded-full bg-gray-400/50 text-white hover:bg-black/60 backdrop-blur-xs transition-all duration-200"
            aria-label="Switch view"
          >
            {activeView === "main" ? <ListChecks size={24} /> : <X size={24} />}
          </button>
        </div> */}

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
