import React, { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { VideoGallery } from "./video-gallery";
import { VideoPlayerView } from "./video-player-view";
import { useVideoMode } from "@/contexts/video-mode-context";

interface Video {
  id: string;
  name: string;
  url: string;
  refUrl?: string;
}

export const VideoSection: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const { setVideoPlayerOpen } = useVideoMode();

  useEffect(() => {
    setVideoPlayerOpen(showPlayer);
  }, [showPlayer, setVideoPlayerOpen]);

  const handleSelect = useCallback((video: Video) => {
    setSelectedVideo(video);
    requestAnimationFrame(() => setShowPlayer(true));
  }, []);

  const handleBack = useCallback(() => {
    setShowPlayer(false);
    setTimeout(() => setSelectedVideo(null), 320);
  }, []);

  return (
    <div className="h-full w-full relative overflow-hidden">
      {/* Gallery */}
      <div
        className={cn(
          "absolute inset-0 transition-all duration-300 ease-in-out",
          showPlayer
            ? "opacity-0 translate-y-4 pointer-events-none"
            : "opacity-100 translate-y-0 pointer-events-auto"
        )}
      >
        <VideoGallery onSelect={handleSelect} />
      </div>

      {/* Player */}
      <div
        className={cn(
          "absolute inset-0 transition-all duration-300 ease-in-out",
          showPlayer
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-4 pointer-events-none"
        )}
      >
        {selectedVideo && (
          <VideoPlayerView video={selectedVideo} onBack={handleBack} />
        )}
      </div>
    </div>
  );
};
