import { z } from "zod";

export const languageSchema = z.object({
  code: z.string(),
  name: z.string(),
});

export const translationTargetRuleSchema = z.object({
  exclude_source_languages: z.array(z.string()),
  source_languages: z.array(z.string()),
  target_language: z.string(),
});

export const modelInfoSchema = z.object({
  id: z.string(),
  languages: z.array(languageSchema),
  name: z.string(),
  transcription_mode: z.string(),
  translation_targets: z.array(translationTargetRuleSchema),
  two_way_translation_pairs: z.array(z.string()),
});

export type Language = z.infer<typeof languageSchema>;
export type TranslationTargetRule = z.infer<typeof translationTargetRuleSchema>;
export type ModelInfo = z.infer<typeof modelInfoSchema>;
