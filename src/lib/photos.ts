export type PhotoModuleRecord = Record<string, { default: string }>;

export const importPhotoModules = (): PhotoModuleRecord =>
  import.meta.glob<{ default: string }>(
    "../assets/photos/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}",
    { eager: true }
  );

const shuffleEntries = <T>(entries: T[]): T[] => {
  const array = [...entries];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

let cachedMixedEntries: Array<[string, { default: string }]> | null = null;

export const getMixedPhotoEntries = () => {
  if (!cachedMixedEntries) {
    const entries = Object.entries(importPhotoModules());
    cachedMixedEntries = shuffleEntries(entries);
  }
  return [...cachedMixedEntries];
};

export const getMixedPhotoUrls = () =>
  getMixedPhotoEntries().map(([, module]) => module.default);
