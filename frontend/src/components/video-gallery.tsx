import React, { useRef, useState, useEffect, useCallback } from "react";

const VIDEO_SUMMARIES: Record<string, string> = {
  "aussie-interview":
    "Woken at 2am by a car crashing into his mate's fish and chip shop, Daniel sprints into the street in his underwear to chase down the fleeing driver and flag the police.",
  "england-usa":
    "England and the USA trade chances in a tense World Cup group stage clash — Kane, Pulisic, and Sterling all go close — but neither side can find the net in a hard-fought goalless draw.",
  "hamilton":
    "Lewis Hamilton nurses a damaged tire through the final laps of a Grand Prix with Verstappen closing fast, before his team orders him to pull over and stop the car on track.",
  "irish_rowing":
    "Brothers Gary and Paul O'Donovan from Skibbereen secure Ireland's first ever Olympic rowing medal, a silver, and reflect on what it means for the sport and the people back home.",
  "perseverance":
    "NASA Mission Control narrates every tense second of Perseverance's descent through the Martian atmosphere — parachute, heat shield, skycrane — until touchdown is confirmed on the surface of Mars.",
  "springbok":
    "South Africa's World Cup-winning captain Siya Kolisi reflects on the team's journey from adversity to glory, and what lifting the trophy means for a divided nation pulling together as one.",
};

interface Video {
  id: string;
  name: string;
  url: string;
  refUrl?: string;
}

const PREVIEW_SEGMENTS = [0.05, 0.2, 0.35, 0.5, 0.65, 0.8] as const;
const SEGMENT_DURATION_MS = 2200;

function randomSegmentIndex(): number {
  return Math.floor(Math.random() * PREVIEW_SEGMENTS.length);
}

interface VideoCardProps extends Video {
  onSelect?: (video: Video) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ id, name, url, refUrl, onSelect }) => {
  const summary = VIDEO_SUMMARIES[id];
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
      className="group relative rounded-[4px] border border-[#2e3330] overflow-hidden cursor-pointer transition-[border-color,box-shadow] duration-200 hover:border-[#29a383]/50 hover:shadow-[0_0_0_1px_rgba(41,163,131,0.1)]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelect?.({ id, name, url, refUrl })}
    >
      <div className="relative w-full bg-[#0d1110]" style={{ aspectRatio: "16 / 9" }}>
        <video
          ref={videoRef}
          src={url}
          muted
          playsInline
          preload="metadata"
          loop={false}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Hover overlay — gradient scrim + summary */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          {summary && (
            <p className="absolute bottom-0 left-0 right-0 px-3 pb-3 text-[0.72rem] leading-[1.6] text-white/90 font-mono">
              {summary}
            </p>
          )}
        </div>
      </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                name={video.name}
                url={video.url}
                refUrl={video.refUrl}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
