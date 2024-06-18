import type {bcVideo} from "@customTypes/types";
import type {configType} from "@src/domainConfig";
export function sortVideosCanonically(videos: bcVideo[]) {
  return videos?.sort((a, b) => {
    if (
      !a.custom_fields ||
      !b.custom_fields ||
      !("canonical_order" in a.custom_fields) ||
      !("canonical_order" in b.custom_fields) ||
      !("chapter" in a.custom_fields) ||
      !("chapter" in b.custom_fields)
    ) {
      return -1;
    }

    const aOrder = Number(a.custom_fields?.canonical_order ?? 0);
    const bOrder = Number(b.custom_fields?.canonical_order ?? 0);
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    const aChapter = Number(a.custom_fields?.chapter ?? 0);
    const bChapter = Number(b.custom_fields.chapter ?? 0);
    return aChapter - bChapter;
  });
}
export function addMp4Srces(videos: bcVideo[]) {
  return videos.map((video) => {
    video.sources = video.sources?.filter((s) => {
      // No http insecure protocol allowed
      return s.src.startsWith("https");
    });
    const mp4Src = video.sources?.find((s) => s.container === "MP4");
    return {
      ...video,
      mp4Src: {
        src: mp4Src?.src || "",
        size: mp4Src?.size || 0,
      },
    };
  });
}

export function formatSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const paddedSeconds = remainingSeconds.toString().padStart(2, "0");
  const paddedMinutes = minutes.toString().padStart(2, "0");
  return `${paddedMinutes}:${paddedSeconds}`;
}

export type userPrefs = {
  autoplay: boolean;
  speed: number[];
};
export const defaultUserPrefs: userPrefs = {
  autoplay: false,
  speed: [1],
};
export function getUserPrefs() {
  const userPrefs = localStorage.getItem("userPrefs");
  if (userPrefs) {
    return JSON.parse(userPrefs) as userPrefs;
  } else {
    // defaults
    return defaultUserPrefs;
  }
}
export function setPrefs<K extends keyof userPrefs>(
  key: K,
  value: userPrefs[K]
) {
  const prefs = getUserPrefs();
  prefs[key] = value;
  localStorage.setItem("userPrefs", JSON.stringify(prefs));
  return prefs;
}

export function getMatchingDomainConfigKey(config: configType, origin: string) {
  // localhost and preview sites, just use one to test against.
  if (
    origin.includes("audio-bible-player.pages.dev") ||
    origin.includes("127.0.0.1") ||
    origin.includes("localhost")
  ) {
    origin = "bermuda";
  }
  let matchingKey = Object.keys(config).find((key) =>
    origin.toLowerCase().includes(key.toLowerCase())
  ) as keyof configType;
  if (!matchingKey || !config[matchingKey]) return undefined;
  return config[matchingKey];
}
