import React from "react";
import { Panel } from "@/components/panel";
import { useUrlSettings } from "@/hooks/use-url-settings";
import { useComparison, type InfoMessage } from "@/contexts/comparison-context";
import { PRIMARY_PROVIDER, type ProviderName } from "@/lib/provider-features";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info, XCircle } from "lucide-react";
import { useFeatures } from "@/contexts/feature-context";
import MarkdownRenderer from "./markdown-renderer";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { TranscriptRenderer } from "./transcript-renderer";

export const ProviderGrid: React.FC = () => {
  const { settings } = useUrlSettings();
  const { selectedProviders = [] } = settings;

  const { providerOutputs, appError } = useComparison();
  const {
    providerFeatures,
    // getProviderFeatures,
    getProviderFeaturesTextTable,
  } = useFeatures();

  // Combine Soniox with other selected providers for rendering
  // Ensure Soniox is always first and no duplicates if it somehow gets into selectedProviders
  const providersToDisplay: ProviderName[] = [
    PRIMARY_PROVIDER,
    ...selectedProviders.filter((p) => p !== PRIMARY_PROVIDER),
  ];

  const getGridColsClass = (count: number): string => {
    // Default to a single column on mobile
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count === 3) return "grid-cols-1 md:grid-cols-3";
    if (count === 4) return "grid-cols-1 md:grid-cols-2"; // 2x2 grid on medium+
    // For 5 or more, use 3 columns on medium+ and let it wrap.
    return "grid-cols-1 md:grid-cols-3";
  };

  // ---- A component used to display additional information or warnings about the provider. ----
  // const renderWarningTooltip = useCallback(
  //   (providerName: ProviderName) => {
  //     const providerFeatures = getProviderFeatures(providerName);
  //     const tooltipContent: ({ title: string; comment: string } | null)[] = [];

  //     const getFeatureComment = (featureKey: string) => {
  //       if (
  //         providerFeatures[featureKey] instanceof Object &&
  //         providerFeatures[featureKey].comment
  //       ) {
  //         return {
  //           title: snakeCaseToTitle(featureKey),
  //           comment: providerFeatures[featureKey].comment,
  //         };
  //       }
  //       return null;
  //     };

  //     if (settings.enableSpeakerDiarization) {
  //       tooltipContent.push(getFeatureComment("speaker_diarization"));
  //     }

  //     if (settings.enableLanguageIdentification) {
  //       tooltipContent.push(getFeatureComment("language_identification"));
  //     }

  //     if (settings.enableEndpointDetection) {
  //       tooltipContent.push(getFeatureComment("endpoint_detection"));
  //     }

  //     if (settings.mode === "mt" && settings.translationType === "one_way") {
  //       tooltipContent.push(getFeatureComment("translation_one_way"));
  //     }

  //     if (settings.mode === "mt" && settings.translationType === "two_way") {
  //       tooltipContent.push(getFeatureComment("translation_two_way"));
  //     }

  //     if (tooltipContent.join("").length > 0) {
  //       return (
  //         <TooltipProvider>
  //           <ResponsiveTooltip
  //             contentClassName="max-w-64"
  //             content={tooltipContent.map(
  //               (item, index) =>
  //                 item && (
  //                   <div key={`${index}-${item.title}`}>
  //                     <p className="font-bold mb-0.5">
  //                       <span>⚠️ </span>
  //                       {item.title}:
  //                     </p>
  //                     <span className="opacity-80">
  //                       <MarkdownRenderer>{item.comment}</MarkdownRenderer>
  //                     </span>
  //                   </div>
  //                 )
  //             )}
  //           >
  //             <AlertTriangle className="w-4 h-4 text-orange-500 cursor-help" />
  //           </ResponsiveTooltip>
  //         </TooltipProvider>
  //       );
  //     }
  //   },
  //   [settings, getProviderFeatures]
  // );

  const numProviders = providersToDisplay.length;
  const gridColsClass = getGridColsClass(numProviders);

  return (
    <div
      className={cn(
        "grid gap-px bg-[#2e3330] h-full overflow-y-auto",
        gridColsClass
      )}
    >
      {providersToDisplay.map((providerName) => {
        const outputData = providerOutputs[providerName] || {
          statusMessage: "Waiting for data...",
          finalParts: [],
          nonFinalParts: [],
          error: null,
          infoMessages: [],
        };
        const panelTitle =
          providerFeatures?.[providerName]?.name ?? providerName;

        return (
          <TooltipProvider key={providerName}>
            <Panel
              title={panelTitle}
              subtitle={providerFeatures?.[providerName]?.model}
              titleTooltip={getProviderFeaturesTextTable(providerName)}
              className={providerName === PRIMARY_PROVIDER ? "text-soniox" : ""}
              // trailingElement={renderWarningTooltip(providerName)} // Removed for now
            >
              <div className="absolute flex flex-col inset-0">
                <div className="relative flex-1">
                  <TranscriptRenderer
                    outputData={outputData}
                    appError={appError}
                  />
                </div>
                <InfoMessages
                  infoMessages={
                    outputData.error
                      ? [
                          ...outputData.infoMessages,
                          {
                            message: outputData.error,
                            level: "error",
                          },
                        ]
                      : outputData.infoMessages
                  }
                />
              </div>
            </Panel>
          </TooltipProvider>
        );
      })}
    </div>
  );
};

interface InfoMessagesProps {
  infoMessages?: InfoMessage[];
}

const InfoMessages = ({ infoMessages }: InfoMessagesProps) => {
  if (!infoMessages || infoMessages.length === 0) {
    return null;
  }

  return (
    <div className="border-t shrink-0 z-10 border-[#2e3330]">
      <Accordion type="multiple" className="w-full">
        {infoMessages.map((info, index) => (
          <AccordionItem
            value={`item-${index}`}
            key={index}
            className="border-b-0 hover:bg-[#29a383]/5 transition-colors"
          >
            <AccordionTrigger className="px-2 py-1.5 text-xs truncate hover:no-underline cursor-pointer">
              <div className="flex items-center gap-2 truncate">
                {info.level === "warning" && (
                  <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                )}
                {info.level === "error" && (
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                )}
                {info.level === "info" && (
                  <Info className="h-4 w-4 text-[#29a383] shrink-0" />
                )}
                <span className="truncate text-[10px] text-[#b4c3be]">{info.message}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-2 mb-1 mx-2 text-[10px] bg-[#1d201f] rounded-[4px]">
              <MarkdownRenderer>{info.message}</MarkdownRenderer>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
