import type {PlaylistResponse, Video, VideoSources} from "@lib/bcApi";
import videojs from "video.js";

declare global {
  interface Window {
    bc: (...args: any[]) => videojs.Player;
  }
}

export interface bcPlaylist extends PlaylistResponse {
  videos: bcVideo[];
}
export interface bcVideo extends Video {
  book: string | undefined;
  custom_fields: Record<string, string>;
  sources: customVideoSources[];
  mp4Src: {
    src: string;
    size: number;
  };
  blobSrc?: string;
  // chapterMarkers: chapterMarkers;
}
export interface customVideoSources extends VideoSources {
  src: string;
  name?: string;
  refId?: string;
}

export type chapterMarkers = {
  chapterStart: number;
  chapterEnd: number;
  label: string;
  xPos: string;
  startVerse: string | null;
  endVerse: string | null;
}[];
