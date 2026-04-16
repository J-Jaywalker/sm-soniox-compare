import { useQueryStates, type inferParserType } from "nuqs";
import {
  parseAsString,
  parseAsStringLiteral,
  parseAsArrayOf,
  parseAsBoolean,
} from "nuqs/server";

import {
  ALL_PROVIDERS_LIST,
  PRIMARY_PROVIDER,
  type ProviderName,
} from "@/lib/provider-features";
import { useMemo } from "react";

export type TranslationType = "one_way" | "two_way";

export const OPERATION_MODES = [
  { value: "stt" as "stt" | "mt", label: "Speech-to-Text" },
  { value: "mt" as "stt" | "mt", label: "Speech Translation" },
];

export interface UrlSettings {
  mode: "stt" | "mt";
  context: string;
  operatingPoint: "standard" | "enhanced";
  enablePartials: boolean;
  targetTranslationLanguage: string;
  sourceTranslationLanguages: string[];
  selectedProviders: ProviderName[];
  enableSpeakerDiarization: boolean;
  enableLanguageIdentification: boolean;
  enableEndpointDetection: boolean;
  enableCustomDictionary: boolean;
  additionalVocab: string;
  enableAudioEvents: boolean;
  audioEventTypes: string;
  enableSpeakerIdentification: boolean;
  translationType: TranslationType;
  selectedFileName: string | null;
}

const defaultMode = OPERATION_MODES[0].value;
const defaultContext: string = "";
const defaultOperatingPoint = "enhanced" as const;
const defaultTargetTranslationLanguage = "es";
const defaultSourceTranslationLanguages: string[] = ["en"];
const defaultTranslationLanguageA = "en";
const defaultTranslationLanguageB = "es";

const initialComparisonProviders = ALL_PROVIDERS_LIST.filter(
  (p) => p !== PRIMARY_PROVIDER
);
const defaultSelectedProviders: ProviderName[] = [
  ...initialComparisonProviders.slice(0, 2),
];
const defaultEnableSpeakerDiarization = true;
const defaultEnableLanguageIdentification = false;
const defaultEnableEndpointDetection = false;
const defaultTranslationType: TranslationType = "one_way";

const modeLiterals = OPERATION_MODES.map((m) => m.value) as ReadonlyArray<
  UrlSettings["mode"]
>;

const providerLiterals = ALL_PROVIDERS_LIST as ReadonlyArray<ProviderName>;
const translationTypeLiterals = ["one_way", "two_way"] as const;

const operatingPointLiterals = ["standard", "enhanced"] as const;

const settingParsers = {
  mode: parseAsStringLiteral(modeLiterals).withDefault(defaultMode),
  context: parseAsString.withDefault(defaultContext),
  operatingPoint: parseAsStringLiteral(operatingPointLiterals).withDefault(defaultOperatingPoint),
  enablePartials: parseAsBoolean.withDefault(true),
  targetTranslationLanguage: parseAsString.withDefault(
    defaultTargetTranslationLanguage
  ),
  sourceTranslationLanguages: parseAsArrayOf(parseAsString).withDefault(
    defaultSourceTranslationLanguages
  ),
  selectedProviders: parseAsArrayOf(
    parseAsStringLiteral(providerLiterals)
  ).withDefault(defaultSelectedProviders),
  enableSpeakerDiarization: parseAsBoolean.withDefault(
    defaultEnableSpeakerDiarization
  ),
  enableLanguageIdentification: parseAsBoolean.withDefault(
    defaultEnableLanguageIdentification
  ),
  enableEndpointDetection: parseAsBoolean.withDefault(
    defaultEnableEndpointDetection
  ),
  enableCustomDictionary: parseAsBoolean.withDefault(false),
  additionalVocab: parseAsString.withDefault(""),
  enableAudioEvents: parseAsBoolean.withDefault(false),
  audioEventTypes: parseAsString.withDefault(""),
  enableSpeakerIdentification: parseAsBoolean.withDefault(false),
  translationType: parseAsStringLiteral(translationTypeLiterals).withDefault(
    defaultTranslationType
  ),
  translationLanguageA: parseAsString.withDefault(defaultTranslationLanguageA),
  translationLanguageB: parseAsString.withDefault(defaultTranslationLanguageB),
  selectedFileName: parseAsString,
};

export type ParsedUrlSettings = inferParserType<typeof settingParsers>;

export function useUrlSettings() {
  const [settings, setSettings] = useQueryStates(settingParsers, {
    history: "replace",
    shallow: false,
  });

  const getSettingsAsUrlParams = () => {
    const params = new URLSearchParams();
    if (!settings) return params.toString();

    params.set("mode", settings.mode);

    if (settings.mode !== "mt") {
      params.append("language_hints", "en");
    }

    params.set("context", settings.context || "");
    params.set("operating_point", settings.operatingPoint);
    params.set("enable_partials", String(settings.enablePartials));
    params.set(
      "enable_speaker_diarization",
      String(settings.enableSpeakerDiarization)
    );

    if (settings.enableCustomDictionary && settings.additionalVocab) {
      params.set("additional_vocab", settings.additionalVocab);
    }

    if (settings.enableAudioEvents) {
      params.set("enable_audio_events", "true");
      if (settings.audioEventTypes) {
        params.set("audio_event_types", settings.audioEventTypes);
      }
    }
    params.set(
      "enable_speaker_identification",
      String(settings.enableSpeakerIdentification)
    );
    params.set(
      "enable_language_identification",
      String(settings.enableLanguageIdentification)
    );
    params.set(
      "enable_endpoint_detection",
      String(settings.enableEndpointDetection)
    );

    if (settings.mode === "mt") {
      params.set("translation_type", settings.translationType);
      if (settings.translationType === "one_way") {
        if (settings.targetTranslationLanguage) {
          params.set(
            "translation_target_language",
            settings.targetTranslationLanguage
          );
        }
        if (
          settings.sourceTranslationLanguages &&
          settings.sourceTranslationLanguages.length > 0
        ) {
          settings.sourceTranslationLanguages.forEach((lang) =>
            params.append("translation_source_languages", lang)
          );
        }
      } else if (settings.translationType === "two_way") {
        params.set("translation_language_a", settings.translationLanguageA);
        params.set("translation_language_b", settings.translationLanguageB);
      }
    }

    params.append("providers", PRIMARY_PROVIDER);
    if (settings.selectedProviders && settings.selectedProviders.length > 0) {
      settings.selectedProviders.forEach((p) => params.append("providers", p));
    }

    return params.toString();
  };

  const isValid = useMemo(() => {
    if (settings.mode === "mt") {
      if (settings.translationType === "one_way") {
        return (
          settings.targetTranslationLanguage &&
          settings.sourceTranslationLanguages.length > 0
        );
      } else if (settings.translationType === "two_way") {
        return settings.translationLanguageA && settings.translationLanguageB;
      }
    }
    return true;
  }, [settings]);

  return {
    settings,
    isValid,
    setSettings,
    setMode: (mode: UrlSettings["mode"]) => setSettings({ mode }),
    setContext: (text: string) => setSettings({ context: text }),
    setOperatingPoint: (point: "standard" | "enhanced") =>
      setSettings({ operatingPoint: point }),
    setEnablePartials: (enabled: boolean) =>
      setSettings({ enablePartials: enabled }),
    setTargetTranslationLanguage: (lang: string) =>
      setSettings({ targetTranslationLanguage: lang }),
    setSourceTranslationLanguages: (langs: string[]) =>
      setSettings({ sourceTranslationLanguages: langs }),
    setSelectedProviders: (providers: ProviderName[]) =>
      setSettings({ selectedProviders: providers }),
    setEnableSpeakerDiarization: (enabled: boolean) =>
      setSettings({ enableSpeakerDiarization: enabled }),
    setEnableLanguageIdentification: (enabled: boolean) =>
      setSettings({ enableLanguageIdentification: enabled }),
    setEnableEndpointDetection: (enabled: boolean) =>
      setSettings({ enableEndpointDetection: enabled }),
    setEnableCustomDictionary: (enabled: boolean) =>
      setSettings({ enableCustomDictionary: enabled }),
    setAdditionalVocab: (vocab: string) =>
      setSettings({ additionalVocab: vocab }),
    setEnableAudioEvents: (enabled: boolean) =>
      setSettings({ enableAudioEvents: enabled }),
    setEnableSpeakerIdentification: (enabled: boolean) =>
      setSettings({ enableSpeakerIdentification: enabled }),
    setAudioEventTypes: (types: string) =>
      setSettings({ audioEventTypes: types }),
    setTranslationType: (type: TranslationType) =>
      setSettings({ translationType: type }),
    setSelectedFileName: (fileName: string | null) =>
      setSettings({ selectedFileName: fileName }),
    getSettingsAsUrlParams,
    setTranslationLanguageA: (lang: string) =>
      setSettings({ translationLanguageA: lang }),
    setTranslationLanguageB: (lang: string) =>
      setSettings({ translationLanguageB: lang }),
  };
}
