import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Mic, Loader2 } from "lucide-react";

interface CustomWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

interface EnrolledResult {
  label: string;
  identifiers: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operatingPoint: string;
  onEnrolled: (speaker: EnrolledResult) => void;
}

type EnrollState = "idle" | "recording" | "processing" | "naming" | "error";

function resample(
  inputBuffer: Float32Array,
  inputSampleRate: number,
  targetSampleRate: number
): Float32Array {
  if (inputSampleRate === targetSampleRate) {
    return inputBuffer;
  }
  const inputLength = inputBuffer.length;
  const outputLength = Math.floor(
    (inputLength * targetSampleRate) / inputSampleRate
  );
  if (outputLength === 0) {
    return new Float32Array(0);
  }
  const outputBuffer = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const t = (i * (inputLength - 1)) / (outputLength - 1);
    const index = Math.floor(t);
    const frac = t - index;
    const val1 = inputBuffer[index];
    const val2 = inputBuffer[index + 1];
    if (val2 === undefined) {
      outputBuffer[i] = val1;
    } else {
      outputBuffer[i] = val1 + (val2 - val1) * frac;
    }
  }
  return outputBuffer;
}

function floatTo16BitPCM(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
}

const MAX_RECORD_SECONDS = 30;

export const EnrollSpeakerDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  operatingPoint,
  onEnrolled,
}) => {
  const [state, setState] = useState<EnrollState>("idle");
  const [countdown, setCountdown] = useState(MAX_RECORD_SECONDS);
  const [errorMessage, setErrorMessage] = useState("");
  const [identifiers, setIdentifiers] = useState<string[]>([]);
  const [speakerName, setSpeakerName] = useState("");
  const [saving, setSaving] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef(MAX_RECORD_SECONDS);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current.onaudioprocess = null;
      processorNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(console.error);
      }
      audioContextRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.onopen = null;
      if (
        wsRef.current.readyState !== WebSocket.CLOSING &&
        wsRef.current.readyState !== WebSocket.CLOSED
      ) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
  }, []);

  // Cleanup on unmount or dialog close
  useEffect(() => {
    if (!open) {
      cleanup();
      setState("idle");
      setCountdown(MAX_RECORD_SECONDS);
      setErrorMessage("");
      setIdentifiers([]);
      setSpeakerName("");
      setSaving(false);
    }
  }, [open, cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startRecording = async () => {
    setState("recording");
    setErrorMessage("");
    setCountdown(MAX_RECORD_SECONDS);
    countdownRef.current = MAX_RECORD_SECONDS;

    try {
      const CustomAudioContext =
        window.AudioContext || (window as unknown as CustomWindow).webkitAudioContext;
      if (!CustomAudioContext) throw new Error("AudioContext not supported.");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "MediaDevices API is not available. Please ensure HTTPS."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
        },
      });
      streamRef.current = stream;

      const context = new CustomAudioContext();
      audioContextRef.current = context;
      sourceNodeRef.current = context.createMediaStreamSource(stream);

      const wsUrl = `${
        window.location.protocol === "https:" ? "wss:" : "ws:"
      }//${
        window.location.host
      }/compare/api/enroll-speaker?operating_point=${operatingPoint}`;

      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        const inputSampleRate = context.sampleRate;
        const targetSampleRate = 16000;

        processorNodeRef.current = context.createScriptProcessor(4096, 1, 1);
        sourceNodeRef.current!.connect(processorNodeRef.current);
        processorNodeRef.current.connect(context.destination);

        processorNodeRef.current.onaudioprocess = (
          e: AudioProcessingEvent
        ) => {
          const inputData = e.inputBuffer.getChannelData(0);
          // Silence the output to avoid feedback
          const outputData = e.outputBuffer.getChannelData(0);
          for (let i = 0; i < outputData.length; i++) {
            outputData[i] = 0;
          }

          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const resampledData = resample(
              inputData,
              inputSampleRate,
              targetSampleRate
            );
            if (resampledData.length > 0) {
              const pcmInt16 = floatTo16BitPCM(resampledData);
              wsRef.current.send(pcmInt16.buffer as ArrayBuffer);
            }
          }
        };

        // Start countdown timer
        timerRef.current = setInterval(() => {
          countdownRef.current -= 1;
          setCountdown(countdownRef.current);
          if (countdownRef.current <= 0) {
            stopRecording();
          }
        }, 1000);
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.type === "speakers_result") {
            const speakers = data.speakers as {
              label: string;
              speaker_identifiers: string[];
            }[];
            if (speakers && speakers.length > 0) {
              setIdentifiers(speakers[0].speaker_identifiers);
              setState("naming");
            } else {
              setErrorMessage("No speaker detected. Please try again.");
              setState("error");
            }
          } else if (data.type === "error") {
            setErrorMessage(data.message || "An error occurred during enrollment.");
            setState("error");
          }
        } catch (e) {
          console.error("Failed to parse enrollment response:", e);
          setErrorMessage("Failed to parse server response.");
          setState("error");
        }
      };

      ws.onerror = () => {
        setErrorMessage("WebSocket connection error.");
        setState("error");
        cleanup();
      };

      ws.onclose = () => {
        // If we were still recording, something went wrong
        if (
          wsRef.current &&
          state !== "processing" &&
          state !== "naming" &&
          state !== "error"
        ) {
          // Only set error if not already transitioned
        }
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setErrorMessage(`Failed to start recording: ${message}`);
      setState("error");
      cleanup();
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop audio capture
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current.onaudioprocess = null;
      processorNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(console.error);
      }
      audioContextRef.current = null;
    }

    // Send END to WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send("END");
    }

    setState("processing");
  };

  const handleSave = async () => {
    if (!speakerName.trim() || identifiers.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/compare/api/speakers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: speakerName.trim(),
          identifiers,
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed to save speaker: ${res.statusText}`);
      }
      const saved = await res.json();
      onEnrolled({
        label: saved.label,
        identifiers: saved.identifiers,
      });
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save speaker.";
      setErrorMessage(message);
      setState("error");
    } finally {
      setSaving(false);
    }
  };

  const handleReRecord = () => {
    cleanup();
    setState("idle");
    setCountdown(MAX_RECORD_SECONDS);
    setIdentifiers([]);
    setSpeakerName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="bg-[#161817] border-[#2e3330] text-[#e6edeb] max-w-md p-0 gap-0"
      >
        <DialogTitle className="sr-only">Enroll Speaker</DialogTitle>
        <DialogDescription className="sr-only">
          Record a voice sample to enroll a new speaker
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
            Enroll Speaker
          </h2>
          <p className="text-[0.72rem] text-[#5f6e6a] mt-0.5">
            Record a voice sample to identify this speaker in future
            transcriptions.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {state === "idle" && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-[0.82rem] text-[#b4c3be] text-center">
                Speak clearly for up to 30 seconds. Ideally speak alone.
              </p>
              <Button
                onClick={startRecording}
                className="bg-[#29a383] hover:bg-[#29a383]/90 text-white text-[0.82rem] gap-2"
              >
                <Mic className="w-4 h-4" />
                Start Recording
              </Button>
            </div>
          )}

          {state === "recording" && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <span className="text-[0.82rem] text-red-400 font-medium">
                  Recording...
                </span>
              </div>
              <div className="text-3xl font-mono text-[#e6edeb] tabular-nums">
                {countdown}s
              </div>
              <Button
                onClick={stopRecording}
                variant="outline"
                className="border-[#2e3330] bg-transparent text-[#b4c3be] hover:bg-[#2e3330] hover:text-[#e6edeb] text-[0.82rem]"
              >
                Stop
              </Button>
            </div>
          )}

          {state === "processing" && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 text-[#29a383] animate-spin" />
              <p className="text-[0.82rem] text-[#b4c3be]">
                Processing audio...
              </p>
            </div>
          )}

          {state === "naming" && (
            <div className="flex flex-col gap-4">
              <p className="text-[0.82rem] text-[#b4c3be]">
                Speaker detected with{" "}
                <span className="text-[#e6edeb] font-medium">
                  {identifiers.length}
                </span>{" "}
                identifier{identifiers.length !== 1 ? "s" : ""}.
              </p>
              <div>
                <label className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#5f6e6a] block mb-1.5">
                  Speaker Name
                </label>
                <input
                  value={speakerName}
                  onChange={(e) => setSpeakerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && speakerName.trim()) {
                      handleSave();
                    }
                  }}
                  placeholder="e.g. Alice"
                  autoFocus
                  className="w-full bg-[#1e201f] border border-[#2e3330] rounded-[4px] px-3 py-2 text-[0.82rem] text-[#e6edeb] placeholder:text-[#3d4845] focus:outline-none focus:border-[#29a383]/60 transition-colors"
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={handleReRecord}
                  className="text-[0.75rem] text-[#5f6e6a] hover:text-[#b4c3be] transition-colors"
                >
                  Re-record
                </button>
                <Button
                  onClick={handleSave}
                  disabled={!speakerName.trim() || saving}
                  className="bg-[#29a383] hover:bg-[#29a383]/90 text-white text-[0.82rem] disabled:opacity-40"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          )}

          {state === "error" && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-[0.82rem] text-red-400 text-center">
                {errorMessage}
              </p>
              <Button
                onClick={handleReRecord}
                className="bg-[#29a383] hover:bg-[#29a383]/90 text-white text-[0.82rem]"
              >
                Try again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
