import React, { useMemo, useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useUrlSettings } from "@/hooks/use-url-settings";
import { useComparison } from "@/contexts/comparison-context";
import { ActionPanel } from "./action-panel";
import { useFeatures } from "@/contexts/feature-context";
import type { ProviderName } from "@/lib/provider-features";

import { FeatureComparisonDialog } from "../feature-comparison-dialog";
import { CustomDictionaryDialog, type VocabEntry } from "../custom-dictionary-dialog";
import { AudioEventsDialog, type AudioEventType } from "../audio-events-dialog";
import { EnrollSpeakerDialog } from "../enroll-speaker-dialog";
import { ManageSpeakersDialog } from "../manage-speakers-dialog";
import { cn } from "@/lib/utils";

const SectionLabel = ({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="flex items-center gap-2">
    <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#5f6e6a] border-l-2 border-[#29a383] pl-2 leading-none">
      {children}
    </p>
    {action}
  </div>
);

export const ControlPanel: React.FC = () => {
  const { recordingState } = useComparison();
  const { providerFeatures, availableComparisonProviders } = useFeatures();

  const {
    settings,
    setSelectedProviders,
    setEnableSpeakerDiarization,
    setOperatingPoint,
    setEnableCustomDictionary,
    setAdditionalVocab,
    setEnableAudioEvents,
    setAudioEventTypes,
    setEnableSpeakerIdentification,
  } = useUrlSettings();
  const {
    selectedProviders = [],
    enableSpeakerDiarization,
    operatingPoint,
    enableCustomDictionary,
    additionalVocab,
    enableAudioEvents,
    audioEventTypes,
    enableSpeakerIdentification,
  } = settings;

  const vocabEntries = useMemo<VocabEntry[]>(() => {
    if (!additionalVocab) return [];
    try {
      return JSON.parse(additionalVocab) as VocabEntry[];
    } catch {
      return [];
    }
  }, [additionalVocab]);

  const selectedAudioEventTypes = useMemo<AudioEventType[]>(() => {
    if (!audioEventTypes) return [];
    try {
      return JSON.parse(audioEventTypes) as AudioEventType[];
    } catch {
      return [];
    }
  }, [audioEventTypes]);

  const [dictDialogOpen, setDictDialogOpen] = React.useState(false);
  const [audioEventsDialogOpen, setAudioEventsDialogOpen] = React.useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = React.useState(false);
  const [manageDialogOpen, setManageDialogOpen] = React.useState(false);
  const [secretMenuOpen, setSecretMenuOpen] = React.useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!secretMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setSecretMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [secretMenuOpen]);

  const isRecording = recordingState === "recording";
  const isStarting = recordingState === "starting";

  const handleProviderSelectionChange = (
    provider: ProviderName,
    checked: boolean | "indeterminate"
  ) => {
    const isActuallyChecked = checked === true;
    const newSelectedProviders = isActuallyChecked
      ? [...selectedProviders, provider]
      : selectedProviders.filter((p) => p !== provider);
    setSelectedProviders(newSelectedProviders);
  };

  const settingsItems = [
    {
      id: "enable-diarization",
      label: "Speaker diarization",
      checked: enableSpeakerDiarization,
      onChange: setEnableSpeakerDiarization,
    },
  ];

  const handleCustomDictChange = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    setEnableCustomDictionary(isChecked);
    if (isChecked && vocabEntries.length === 0) {
      setDictDialogOpen(true);
    }
  };

  const handleVocabSave = (entries: VocabEntry[]) => {
    setAdditionalVocab(entries.length > 0 ? JSON.stringify(entries) : "");
    if (entries.length > 0) {
      setEnableCustomDictionary(true);
    }
  };

  const handleAudioEventsChange = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    setEnableAudioEvents(isChecked);
    if (isChecked) {
      setAudioEventsDialogOpen(true);
    }
  };

  const handleAudioEventTypesSave = (types: AudioEventType[]) => {
    setAudioEventTypes(types.length > 0 ? JSON.stringify(types) : "");
  };


  return (
    <div className="h-full flex flex-col bg-[#101211]">
      {/* Brand header — click to reveal secret enrolment menu */}
      <div
        ref={headerRef}
        className="shrink-0 px-4 py-3.5 bg-[#0D3C48] cursor-pointer select-none"
        onClick={() => setSecretMenuOpen((o) => !o)}
      >
        <div className="relative">
          {/* Title — always rendered for sizing, slides up and fades out when menu opens */}
          <div className={cn(
            "transition-all duration-200 ease-in-out",
            secretMenuOpen ? "opacity-0 -translate-y-1 pointer-events-none" : "opacity-100 translate-y-0"
          )}>
            <h2 className="text-sm font-semibold tracking-tight text-white">
              Speechmatics Compare
            </h2>
            <p className="text-[0.72rem] text-white/45 mt-0.5">
              Real-time ASR comparison
            </p>
          </div>
          {/* Secret menu — always rendered, slides in from left */}
          <div
            className={cn(
              "absolute inset-0 flex items-center gap-2 transition-all duration-200 ease-in-out",
              secretMenuOpen
                ? "opacity-100 translate-x-0 pointer-events-auto"
                : "opacity-0 -translate-x-2 pointer-events-none"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setEnrollDialogOpen(true)}
              className="px-3 py-1.5 rounded-[3px] border border-white/20 text-[0.75rem] font-medium text-white/80 hover:border-white/50 hover:text-white hover:bg-white/8 transition-all duration-150"
            >
              Enroll Speaker
            </button>
            <button
              onClick={() => setManageDialogOpen(true)}
              className="px-3 py-1.5 rounded-[3px] border border-white/20 text-[0.75rem] font-medium text-white/80 hover:border-white/50 hover:text-white hover:bg-white/8 transition-all duration-150"
            >
              Manage
            </button>
            <button
              onClick={() => setSecretMenuOpen(false)}
              className="px-3 py-1.5 rounded-[3px] border border-white/10 text-[0.75rem] font-medium text-white/40 hover:border-white/30 hover:text-white/70 transition-all duration-150 ml-auto"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col divide-y divide-[#1e201f]">
          {/* Providers */}
          <section className="px-4 py-5 space-y-3">
            <SectionLabel>Providers</SectionLabel>
            <div className="space-y-1.5">
              {availableComparisonProviders.map((provider) => {
                const isSelected = selectedProviders.includes(provider);
                const isDisabled = isRecording || !providerFeatures;
                return (
                  <label
                    key={provider}
                    htmlFor={`provider-checkbox-${provider}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 border rounded-[4px] cursor-pointer transition-all duration-150 select-none",
                      isSelected
                        ? "border-[#29a383]/40 bg-[#29a383]/8"
                        : "border-[#2e3330] hover:border-[#29a383]/25 hover:bg-[#29a383]/4",
                      isDisabled && "opacity-40 cursor-not-allowed pointer-events-none"
                    )}
                  >
                    <Checkbox
                      id={`provider-checkbox-${provider}`}
                      checked={isSelected}
                      onCheckedChange={(checkedState) =>
                        handleProviderSelectionChange(provider, checkedState)
                      }
                      disabled={isDisabled}
                      className="border-[#37403e] data-[state=checked]:bg-[#29a383] data-[state=checked]:border-[#29a383] shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[0.82rem] font-medium text-[#e6edeb] capitalize truncate leading-snug">
                        {providerFeatures?.[provider]?.name ?? provider}
                      </span>
                      {providerFeatures?.[provider]?.model && (
                        <span className="text-[0.72rem] text-[#5f6e6a] truncate">
                          {providerFeatures[provider].model}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
              {availableComparisonProviders.length === 0 && providerFeatures && (
                <p className="text-xs text-[#5f6e6a] px-1 py-2">
                  No other providers available.
                </p>
              )}
              {!providerFeatures && (
                <p className="text-xs text-[#5f6e6a] px-1 py-2 animate-pulse">
                  Loading providers...
                </p>
              )}
            </div>
          </section>

          {/* Operating Point */}
          <section className="px-4 py-5 space-y-3">
            <SectionLabel>Operating Point</SectionLabel>
            <div
              className={cn(
                "flex rounded-[4px] border border-[#2e3330] overflow-hidden transition-opacity",
                (isRecording || isStarting) && "opacity-40 pointer-events-none"
              )}
            >
              {(["standard", "enhanced"] as const).map((point, i) => (
                <React.Fragment key={point}>
                  {i > 0 && <div className="w-px shrink-0 bg-[#2e3330]" />}
                  <button
                    onClick={() => setOperatingPoint(point)}
                    className={cn(
                      "flex-1 py-2.5 text-[0.78rem] font-medium tracking-wide capitalize transition-all duration-150",
                      operatingPoint === point
                        ? "bg-[#29a383]/12 text-[#29a383]"
                        : "text-[#5f6e6a] hover:text-[#b4c3be] hover:bg-[#29a383]/4"
                    )}
                  >
                    {point}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </section>

          {/* Settings */}
          <section className="px-4 py-5 space-y-3">
            <SectionLabel>Settings</SectionLabel>
            <div className="space-y-1.5">
              {/* Custom Dictionary — special row with Edit button */}
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 border rounded-[4px] transition-all duration-150 select-none",
                  enableCustomDictionary
                    ? "border-[#29a383]/40 bg-[#29a383]/8"
                    : "border-[#2e3330] hover:border-[#29a383]/25 hover:bg-[#29a383]/4",
                  (isRecording || isStarting) &&
                    "opacity-40 cursor-not-allowed pointer-events-none"
                )}
              >
                <Checkbox
                  id="enable-custom-dictionary"
                  checked={enableCustomDictionary}
                  onCheckedChange={handleCustomDictChange}
                  disabled={isRecording || isStarting}
                  className="border-[#37403e] data-[state=checked]:bg-[#29a383] data-[state=checked]:border-[#29a383] shrink-0 cursor-pointer"
                />
                <label
                  htmlFor="enable-custom-dictionary"
                  className="flex-1 text-[0.82rem] font-medium text-[#e6edeb] cursor-pointer"
                >
                  Custom Dictionary
                </label>
                {enableCustomDictionary && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDictDialogOpen(true);
                    }}
                    className="px-2 py-0.5 rounded-[3px] border border-[#2e3330] text-[0.7rem] font-medium text-[#b4c3be] hover:border-[#29a383]/50 hover:text-[#29a383] hover:bg-[#29a383]/6 transition-all duration-150 shrink-0 cursor-pointer"
                  >
                    Edit
                  </button>
                )}
              </div>

              {settingsItems.map(({ id, label, checked, onChange }) => (
                <label
                  key={id}
                  htmlFor={id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 border rounded-[4px] cursor-pointer transition-all duration-150 select-none",
                    checked
                      ? "border-[#29a383]/40 bg-[#29a383]/8"
                      : "border-[#2e3330] hover:border-[#29a383]/25 hover:bg-[#29a383]/4",
                    (isRecording || isStarting) &&
                      "opacity-40 cursor-not-allowed pointer-events-none"
                  )}
                >
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(c) => onChange(Boolean(c))}
                    disabled={isRecording || isStarting}
                    className="border-[#37403e] data-[state=checked]:bg-[#29a383] data-[state=checked]:border-[#29a383] shrink-0"
                  />
                  <span className="text-[0.82rem] font-medium text-[#e6edeb]">
                    {label}
                  </span>
                </label>
              ))}

              {/* Speaker Identification — special row with Enroll/Manage buttons */}
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 border rounded-[4px] transition-all duration-150 select-none",
                  enableSpeakerIdentification
                    ? "border-[#29a383]/40 bg-[#29a383]/8"
                    : "border-[#2e3330] hover:border-[#29a383]/25 hover:bg-[#29a383]/4",
                  (isRecording || isStarting) &&
                    "opacity-40 cursor-not-allowed pointer-events-none"
                )}
              >
                <Checkbox
                  id="enable-speaker-identification"
                  checked={enableSpeakerIdentification}
                  onCheckedChange={(c) =>
                    setEnableSpeakerIdentification(Boolean(c))
                  }
                  disabled={isRecording || isStarting}
                  className="border-[#37403e] data-[state=checked]:bg-[#29a383] data-[state=checked]:border-[#29a383] shrink-0 cursor-pointer"
                />
                <label
                  htmlFor="enable-speaker-identification"
                  className="flex-1 text-[0.82rem] font-medium text-[#e6edeb] cursor-pointer"
                >
                  Speaker Identification
                </label>
              </div>

              {/* Audio Events — special row with Edit button */}
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 border rounded-[4px] transition-all duration-150 select-none",
                  enableAudioEvents
                    ? "border-[#29a383]/40 bg-[#29a383]/8"
                    : "border-[#2e3330] hover:border-[#29a383]/25 hover:bg-[#29a383]/4",
                  (isRecording || isStarting) &&
                    "opacity-40 cursor-not-allowed pointer-events-none"
                )}
              >
                <Checkbox
                  id="enable-audio-events"
                  checked={enableAudioEvents}
                  onCheckedChange={handleAudioEventsChange}
                  disabled={isRecording || isStarting}
                  className="border-[#37403e] data-[state=checked]:bg-[#29a383] data-[state=checked]:border-[#29a383] shrink-0 cursor-pointer"
                />
                <label
                  htmlFor="enable-audio-events"
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <span className="text-[0.82rem] font-medium text-[#e6edeb]">
                    Audio Events
                  </span>
                </label>
                {enableAudioEvents && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAudioEventsDialogOpen(true);
                    }}
                    className="px-2 py-0.5 rounded-[3px] border border-[#2e3330] text-[0.7rem] font-medium text-[#b4c3be] hover:border-[#29a383]/50 hover:text-[#29a383] hover:bg-[#29a383]/6 transition-all duration-150 shrink-0 cursor-pointer"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className="pt-1 hidden sm:flex w-full">
              <FeatureComparisonDialog />
            </div>
          </section>
        </div>
      </div>

      <ActionPanel />

      <CustomDictionaryDialog
        open={dictDialogOpen}
        onOpenChange={setDictDialogOpen}
        initialEntries={vocabEntries}
        onSave={handleVocabSave}
      />

      <AudioEventsDialog
        open={audioEventsDialogOpen}
        onOpenChange={setAudioEventsDialogOpen}
        initialTypes={selectedAudioEventTypes}
        onSave={handleAudioEventTypesSave}
      />

      <EnrollSpeakerDialog
        open={enrollDialogOpen}
        onOpenChange={setEnrollDialogOpen}
        operatingPoint={operatingPoint}
        onEnrolled={() => {
          // Speaker enrolled successfully — dialog closes itself
        }}
      />

      <ManageSpeakersDialog
        open={manageDialogOpen}
        onOpenChange={setManageDialogOpen}
      />
    </div>
  );
};
