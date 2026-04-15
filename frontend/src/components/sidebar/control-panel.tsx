import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useUrlSettings } from "@/hooks/use-url-settings";
import { useComparison } from "@/contexts/comparison-context";
import { ActionPanel } from "./action-panel";
import { useModelData } from "@/contexts/model-data-context";
import { SearchSelect } from "@/components/ui/search-select";
import { useFeatures } from "@/contexts/feature-context";
import type { ProviderName } from "@/lib/provider-features";
import { ResponsiveTooltip } from "../ui/responsive-tooltip";
import { FeatureComparisonDialog } from "../feature-comparison-dialog";
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
  const { modelInfo } = useModelData();

  const {
    settings,
    setSelectedProviders,
    setLanguageHints,
    setEnableSpeakerDiarization,
  } = useUrlSettings();
  const {
    selectedProviders = [],
    languageHints = [],
    enableSpeakerDiarization,
  } = settings;

  const [enableCustomDictionary, setEnableCustomDictionary] = React.useState(false);
  const [enableSpeakerIdentification, setEnableSpeakerIdentification] = React.useState(false);
  const [enableAudioEvents, setEnableAudioEvents] = React.useState(false);
  const [operatingPoint, setOperatingPoint] = React.useState<"standard" | "enhanced">("standard");

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

  const handleLanguageHintChange = (value: string) => {
    if (value === "AUTO") {
      setLanguageHints([]);
    } else {
      setLanguageHints([value]);
    }
  };

  const settingsItems = [
    {
      id: "enable-diarization",
      label: "Speaker diarization",
      checked: enableSpeakerDiarization,
      onChange: setEnableSpeakerDiarization,
    },
    {
      id: "enable-custom-dictionary",
      label: "Custom Dictionary",
      checked: enableCustomDictionary,
      onChange: setEnableCustomDictionary,
    },
    {
      id: "enable-speaker-identification",
      label: "Speaker Identification",
      checked: enableSpeakerIdentification,
      onChange: setEnableSpeakerIdentification,
    },
    {
      id: "enable-audio-events",
      label: "Audio Events",
      checked: enableAudioEvents,
      onChange: setEnableAudioEvents,
    },
  ];

  return (
    <div className="h-full flex flex-col bg-[#101211]">
      {/* Brand header */}
      <div className="shrink-0 px-4 py-3.5 bg-[#0D3C48]">
        <h2 className="text-sm font-semibold tracking-tight text-white">
          Speechmatics Compare
        </h2>
        <p className="text-[0.72rem] text-white/45 mt-0.5">
          Real-time ASR comparison
        </p>
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

          {/* Language */}
          <section className="px-4 py-5 space-y-3">
            <SectionLabel
              action={
                <TooltipProvider>
                  <ResponsiveTooltip
                    content={
                      <p className="max-w-xs text-xs">
                        Most providers require a language hint. Speechmatics
                        can auto-identify the spoken language in real-time —
                        try Multilingual and speak in different languages.
                      </p>
                    }
                  >
                    <Info className="h-3.5 w-3.5 cursor-help text-[#5f6e6a] hover:text-[#b4c3be] transition-colors" />
                  </ResponsiveTooltip>
                </TooltipProvider>
              }
            >
              Language
            </SectionLabel>
            <SearchSelect
              value={languageHints.length > 0 ? languageHints[0] : "AUTO"}
              onValueChange={handleLanguageHintChange}
              disabled={isRecording}
              options={[
                { value: "AUTO", label: "Multilingual (auto-identify)" },
                ...(modelInfo?.languages.map((lang) => ({
                  value: lang.code,
                  label: lang.name,
                })) || []),
              ]}
              placeholder="Select language"
              searchPlaceholder="Search languages..."
              notFoundMessage="No language found."
              className="w-full text-sm bg-[#1d201f] border-[#2e3330] text-[#e6edeb]"
            />
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
            </div>

            <div className="pt-1 hidden sm:flex w-full">
              <FeatureComparisonDialog />
            </div>
          </section>
        </div>
      </div>

      <ActionPanel />
    </div>
  );
};
