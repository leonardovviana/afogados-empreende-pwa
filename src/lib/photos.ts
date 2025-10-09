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
    const extensionOrder = new Map([
      [".webp", 0],
      [".avif", 1],
      [".png", 2],
      [".jpg", 3],
      [".jpeg", 4],
    ]);

    const dedupMap = entries.reduce((acc, entry) => {
        const [filePath] = entry;
        const extension = filePath.slice(filePath.lastIndexOf("."))?.toLowerCase() ?? "";
        const baseKey = filePath.replace(/\.[^.]+$/, "").toLowerCase();
        const currentPriority = extensionOrder.get(extension) ?? Number.MAX_SAFE_INTEGER;

        const existing = acc.get(baseKey);
        if (!existing) {
          acc.set(baseKey, { entry, priority: currentPriority });
          return acc;
        }

        if (currentPriority < existing.priority) {
          acc.set(baseKey, { entry, priority: currentPriority });
        }

        return acc;
      }, new Map<string, { entry: [string, { default: string }]; priority: number }>())
    ;

    const dedupedEntries = Array.from(dedupMap.values()).map(({ entry }) => entry);

    cachedMixedEntries = shuffleEntries(dedupedEntries);
  }
  return [...cachedMixedEntries];
};

export const getMixedPhotoUrls = () =>
  getMixedPhotoEntries().map(([, module]) => module.default);
