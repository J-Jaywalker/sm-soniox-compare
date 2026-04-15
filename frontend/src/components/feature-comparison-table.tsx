import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Asterisk,
  type LucideIcon,
  HelpCircle,
} from "lucide-react";
import { cn, snakeCaseToTitle } from "@/lib/utils";
import { useFeatures } from "@/contexts/feature-context";
import { PRIMARY_PROVIDER } from "@/lib/provider-features";
import { useMemo } from "react";
import MarkdownRenderer from "./markdown-renderer";
import { ResponsiveTooltip } from "./ui/responsive-tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip";

const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  customization: "Custom Dictionary",
  translation_one_way: "Translation",
  real_time_latency_config: "Deep Transcript Configurability",
};

export const FeatureComparisonTable = () => {
  const { providerFeatures, availableComparisonProviders, getFeatureSet } =
    useFeatures();

  const allProviderNames = useMemo(() => {
    return [PRIMARY_PROVIDER, ...availableComparisonProviders];
  }, [availableComparisonProviders]);

  if (!providerFeatures) {
    return <p>No provider features available to compare.</p>;
  }

  return (
    <div className="inset-0 absolute overflow-x-auto">
      <table className="text-xs sm:text-sm border-collapse min-w-full">
        <thead>
          <tr className="border-b bg-gray-100 dark:bg-gray-800">
            <th className="p-2 sm:p-3 sm:pl-14 lg:pl-3 text-left font-semibold text-gray-700 dark:text-gray-300 sticky left-0 bg-gray-100 dark:bg-gray-800 z-10 w-[100px] min-w-[100px] md:w-[200px] md:min-w-[200px]">
              Feature
            </th>
            {allProviderNames.map((providerName) => (
              <th
                key={providerName}
                className="py-2 pt-5 sm:py-3 px-0.5 align-top text-center font-semibold text-gray-700 dark:text-gray-300 capitalize w-[80px] min-w-[80px] md:w-[120px] md:min-w-[120px]"
              >
                {providerFeatures[providerName]?.name ||
                  snakeCaseToTitle(providerName)}
                <div className="text-[9px] sm:text-[10px] text-gray-400 lowercase">
                  {providerFeatures[providerName]?.model}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {getFeatureSet().map((featureKey) => (
            <tr
              key={featureKey}
              className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <td className="p-2 sm:p-3 text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/50 z-10 w-[100px] min-w-[100px] md:w-[200px] md:min-w-[200px]">
                <span className="text-[10px] sm:text-sm">
                  {FEATURE_DISPLAY_NAMES[featureKey] ?? snakeCaseToTitle(featureKey)}
                </span>
              </td>
              {allProviderNames.map((providerName) => (
                <td
                  key={providerName}
                  className="py-2 sm:py-3 text-center w-[80px] min-w-[80px] md:w-[120px] md:min-w-[120px]"
                >
                  {renderFeatureSupport(
                    providerFeatures[providerName]?.[featureKey]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const renderFeatureSupport = (
  feature:
    | boolean
    | { state: "SUPPORTED" | "UNSUPPORTED" | "PARTIAL"; comment?: string }
    | undefined
) => {
  let colorClass: string = "text-red-600";
  let IconElement: LucideIcon = XCircle;
  let commentForTooltip: string | undefined = undefined;

  if (feature === true) {
    colorClass = "text-green-600";
    IconElement = CheckCircle2;
  } else if (feature === false) {
    colorClass = "text-red-600";
    IconElement = XCircle;
  } else if (feature && typeof feature === "object" && "state" in feature) {
    commentForTooltip = feature.comment;
    switch (feature.state) {
      case "SUPPORTED":
        colorClass = "text-green-600";
        IconElement = CheckCircle2;
        break;
      case "UNSUPPORTED":
        colorClass = "text-red-600";
        IconElement = XCircle;
        break;
      case "PARTIAL":
        colorClass = "text-orange-400";
        IconElement = AlertCircle;
        break;
      default:
        colorClass = "text-black";
        IconElement = HelpCircle;
        break;
    }
  }

  if (commentForTooltip) {
    return (
      <TooltipProvider>
        <ResponsiveTooltip
          contentClassName="text-xs max-w-72"
          content={<MarkdownRenderer>{commentForTooltip}</MarkdownRenderer>}
        >
          <span className={cn("relative", colorClass)}>
            <IconElement className="inline-block h-4 w-4 sm:h-5 sm:w-5" />
            <Asterisk className="absolute -top-1 -right-1 h-2 w-2 rounded-full sm:-top-2 sm:-right-2 sm:h-3 sm:w-3" />
          </span>
        </ResponsiveTooltip>
      </TooltipProvider>
    );
  }

  return (
    <IconElement
      className={cn("inline-block h-4 w-4 sm:h-5 sm:w-5", colorClass)}
    />
  );
};
