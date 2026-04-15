export const ALL_PROVIDERS_LIST = [
  "speechmatics",
  "google",
  "azure",
  "deepgram",
] as const;
export type ProviderName = (typeof ALL_PROVIDERS_LIST)[number];

export const PRIMARY_PROVIDER = ALL_PROVIDERS_LIST[0];
