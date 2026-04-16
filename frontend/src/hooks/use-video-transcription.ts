import { useRef, useState, useCallback } from "react";
import { type ProviderName } from "@/lib/provider-features";

export interface VideoProviderOutput {
  finalText: string;
  pendingText: string;
  error: string;
  status: string;
}

export type VideoTranscriptOutputs = Partial<Record<ProviderName, VideoProviderOutput>>;
export type VideoTranscriptionState = "idle" | "connecting" | "transcribing";

interface CustomWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

function floatTo16BitPCM(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
}

function resample(input: Float32Array, inRate: number, outRate: number): Float32Array {
  if (inRate === outRate) return input;
  const outLen = Math.floor((input.length * outRate) / inRate);
  if (outLen === 0) return new Float32Array(0);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const t = (i * (input.length - 1)) / (outLen - 1);
    const idx = Math.floor(t);
    const frac = t - idx;
    out[i] =
      idx + 1 < input.length
        ? input[idx] * (1 - frac) + input[idx + 1] * frac
        : input[idx];
  }
  return out;
}

const emptyOutput = (): VideoProviderOutput => ({
  finalText: "",
  pendingText: "",
  error: "",
  status: "",
});

const initOutputs = (providers: ProviderName[]): VideoTranscriptOutputs =>
  Object.fromEntries(providers.map((p) => [p, emptyOutput()]));

export function useVideoTranscription() {
  const [state, setState] = useState<VideoTranscriptionState>("idle");
  const [outputs, setOutputs] = useState<VideoTranscriptOutputs>({});
  const [activeProviders, setActiveProviders] = useState<ProviderName[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const stateRef = useRef<VideoTranscriptionState>("idle");

  const setStateBoth = (s: VideoTranscriptionState) => {
    stateRef.current = s;
    setState(s);
  };

  const stopTranscription = useCallback(() => {
    if (sourceRef.current && processorRef.current) {
      try {
        sourceRef.current.disconnect(processorRef.current);
      } catch {}
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (wsRef.current) {
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws.readyState === WebSocket.OPEN) ws.send("END");
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      ws.onopen = null;
      if (
        ws.readyState !== WebSocket.CLOSING &&
        ws.readyState !== WebSocket.CLOSED
      ) {
        ws.close();
      }
    }
    setStateBoth("idle");
  }, []);

  const cleanup = useCallback(() => {
    stopTranscription();
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    sourceRef.current = null;
  }, [stopTranscription]);

  const start = useCallback(
    async (
      videoEl: HTMLVideoElement,
      urlParams: string,
      providers: ProviderName[]
    ) => {
      if (stateRef.current !== "idle") return;

      setActiveProviders(providers);
      setOutputs(initOutputs(providers));
      setStateBoth("connecting");
      setOutputs((prev) => {
        const next = { ...prev };
        providers.forEach((p) => {
          next[p] = { ...emptyOutput(), status: "Connecting..." };
        });
        return next;
      });

      // Initialize audio once per video element (createMediaElementSource can only be called once per element)
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        const CustomAudioContext =
          window.AudioContext || (window as CustomWindow).webkitAudioContext;
        if (!CustomAudioContext) {
          setStateBoth("idle");
          return;
        }
        const ctx = new CustomAudioContext();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaElementSource(videoEl);
        sourceRef.current = source;
        source.connect(ctx.destination); // keep video audible
      }

      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(
        `${proto}//${window.location.host}/compare/api/compare-websocket?${urlParams}`
      );
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        if (stateRef.current === "idle") return;
        setStateBoth("transcribing");
        setOutputs((prev) => {
          const next = { ...prev };
          providers.forEach((p) => {
            next[p] = { ...next[p]!, status: "" };
          });
          return next;
        });

        const ctx = audioCtxRef.current!;
        const source = sourceRef.current!;
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        source.connect(processor);
        processor.connect(ctx.destination);

        const inputRate = ctx.sampleRate;
        processor.onaudioprocess = (e) => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
            return;
          const data = e.inputBuffer.getChannelData(0);
          const resampled = resample(data, inputRate, 16000);
          if (resampled.length > 0) {
            wsRef.current.send(
              floatTo16BitPCM(resampled).buffer as ArrayBuffer
            );
          }
        };

        videoEl.currentTime = 0;
        videoEl.play().catch(() => {});
      };

      ws.onmessage = (event: MessageEvent) => {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(event.data as string);
        } catch {
          return;
        }

        const provider = msg.provider as ProviderName;
        if (!provider) return;

        setOutputs((prev) => {
          const cur = { ...(prev[provider] ?? emptyOutput()) };

          if (msg.type === "error" || msg.error_message) {
            cur.error =
              (msg.error_message as string) ||
              (msg.message as string) ||
              "Unknown error";
            cur.status = "";
          } else if (msg.type === "data") {
            cur.status = "";
            cur.error = "";
            let newFinal = "";
            let newPending = "";
            for (const part of (
              msg.parts as Array<{ text: string; is_final: boolean }>
            ) ?? []) {
              if (part.is_final) newFinal += part.text;
              else newPending += part.text;
            }
            if (newFinal) {
              cur.finalText += newFinal;
              cur.pendingText = "";
            }
            if (newPending) {
              cur.pendingText = newPending;
            }
          }

          return { ...prev, [provider]: cur };
        });
      };

      ws.onerror = () => stopTranscription();
      ws.onclose = () => {
        if (stateRef.current !== "idle") stopTranscription();
      };
    },
    [stopTranscription]
  );

  const stop = useCallback(
    (videoEl?: HTMLVideoElement | null) => {
      if (videoEl) videoEl.pause();
      stopTranscription();
    },
    [stopTranscription]
  );

  return { state, outputs, activeProviders, start, stop, cleanup };
}
