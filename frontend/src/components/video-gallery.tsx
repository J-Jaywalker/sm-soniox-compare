import React, { useRef, useState, useEffect, useCallback } from "react";

interface Video {
  id: string;
  name: string;
  url: string;
}

const PREVIEW_SEGMENTS = [0.05, 0.2, 0.35, 0.5, 0.65, 0.8] as const;
const SEGMENT_DURATION_MS = 2200;

function randomSegmentIndex(): number {
  return Math.floor(Math.random() * PREVIEW_SEGMENTS.length);
}

interface VideoCardProps extends Video {
  onSelect?: (video: Video) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ id, name, url, onSelect }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const segmentIndexRef = useRef<number>(randomSegmentIndex());

  const clearPreviewTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const playSegment = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration || Number.isNaN(video.duration)) return;

    const idx = segmentIndexRef.current % PREVIEW_SEGMENTS.length;
    video.currentTime = video.duration * PREVIEW_SEGMENTS[idx];
    video.play().catch(() => {
      /* autoplay may be blocked — silently ignore */
    });

    timeoutRef.current = setTimeout(() => {
      segmentIndexRef.current = (segmentIndexRef.current + 1) % PREVIEW_SEGMENTS.length;
      playSegment();
    }, SEGMENT_DURATION_MS);
  }, []);

  const handleMouseEnter = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.readyState < 1) {
      const onLoaded = () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        playSegment();
      };
      video.addEventListener("loadedmetadata", onLoaded);
    } else {
      playSegment();
    }
  }, [playSegment]);

  const handleMouseLeave = useCallback(() => {
    clearPreviewTimeout();
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    segmentIndexRef.current = randomSegmentIndex();
  }, [clearPreviewTimeout]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
    }
    return () => {
      clearPreviewTimeout();
    };
  }, [clearPreviewTimeout]);

  return (
    <div
      className="rounded-[4px] border border-[#2e3330] bg-[#1d201f] overflow-hidden transition-colors duration-150 hover:border-[#29a383]/40 cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelect?.({ id, name, url })}
    >
      <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
        <video
          ref={videoRef}
          src={url}
          muted
          playsInline
          preload="metadata"
          loop={false}
          className="absolute inset-0 w-full h-full object-cover bg-[#0d1110]"
        />
      </div>
      <p className="text-[0.82rem] font-medium text-[#e6edeb] px-3 py-2 truncate">
        {name}
      </p>
    </div>
  );
};

interface VideoGalleryProps {
  onSelect?: (video: Video) => void;
}

export const VideoGallery: React.FC<VideoGalleryProps> = ({ onSelect }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchVideos() {
      try {
        const response = await fetch("/compare/api/videos");
        if (!response.ok) {
          throw new Error(`Failed to fetch videos (${response.status})`);
        }
        const data: { videos: Video[] } = await response.json();
        if (!cancelled) {
          setVideos(data.videos);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load videos"
          );
          setLoading(false);
        }
      }
    }

    fetchVideos();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="h-full w-full bg-[#101211] overflow-y-auto">
      <div className="p-6 space-y-5">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#5f6e6a] border-l-2 border-[#29a383] pl-2 leading-none">
          Select a Video
        </p>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <p className="text-[0.78rem] text-[#5f6e6a] animate-pulse">
              Loading videos...
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-16">
            <p className="text-[0.78rem] text-[#c45a4a]">{error}</p>
          </div>
        )}

        {!loading && !error && videos.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <p className="text-[0.78rem] text-[#5f6e6a]">
              No videos available.
            </p>
          </div>
        )}

        {!loading && !error && videos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                name={video.name}
                url={video.url}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
