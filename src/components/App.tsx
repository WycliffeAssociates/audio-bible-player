import type {bcPlaylist, bcVideo} from "@customTypes/types";
import {
  For,
  Show,
  Suspense,
  createResource,
  createSignal,
  onMount,
  type Accessor,
  type Resource,
  type Setter,
} from "solid-js";
import {Player} from "./Player";
import {formatSeconds} from "@lib/utils";
import {get, set, keys, del} from "idb-keyval";
import {Button} from "@kobalte/core/button";
import {ToggleButton} from "@kobalte/core/toggle-button";
import {MaterialSymbolsFavorite, MdiLoading} from "./Icons";

type appProps = {
  playlist: bcPlaylist;
  initialVideo: bcVideo;
};
export function App(props: appProps) {
  const [video, setVideo] = createSignal<bcVideo>(props.initialVideo);
  const [resolvedVideoSrc] = createResource(video, resolveSrc);

  // Everything is computed off the current video, but we aren't necessarily changing the video if we save a different one, so this is a temp variable to toggle save icon of videos that aren't the current one.
  const [savedOffline, setSavedOffline] = createSignal<string[]>([]);
  const [isLoading, setIsLoading] = createSignal<string[]>([]);
  onMount(() => {
    getSavedOffline();
  });

  async function getSavedOffline() {
    if (import.meta.env.SSR) return [];
    const allVidId = props.playlist.videos.map((v) => v.id!);
    const results = await keys();
    const saved = results.filter((v) =>
      allVidId.includes(String(v))
    ) as string[];
    setSavedOffline(saved);
  }
  async function resolveSrc(vid: bcVideo) {
    if (import.meta.env.SSR) return vid.mp4Src.src;
    if (vid.blobSrc) return vid.blobSrc;
    const blob = (await get(vid.id!)) as Blob | undefined;
    if (blob) {
      vid.blobSrc = URL.createObjectURL(blob);
      return vid.blobSrc;
    } else {
      return vid.mp4Src.src;
    }
  }
  async function saveVidOffline(vid: bcVideo) {
    try {
      const res = await fetch(vid.mp4Src.src);
      setIsLoading([...isLoading(), vid.id!]);
      const blob = await res.blob();
      await set(vid.id!, blob);
      vid.blobSrc = URL.createObjectURL(blob);
      setIsLoading([...isLoading()].filter((id) => id! != vid.id!));
      getSavedOffline();
    } catch (error) {
      console.error(error);
    }
  }
  async function removeVidIndexedDb(vid: bcVideo) {
    await del(vid.id!);
    getSavedOffline();
  }

  const books = [
    ...new Set(
      props.playlist.videos.map((v) => v.custom_fields.localized_book_name)
    ),
  ];
  const chapters = () =>
    props.playlist.videos.filter(
      (v) => v.custom_fields?.book === video().custom_fields?.book
    );

  const switchBook = (localizedBook: string) => {
    const book = props.playlist.videos.find(
      (v) => v.custom_fields.localized_book_name === localizedBook
    );
    if (book) {
      setVideo(book);
    }
  };
  const vidDetails = (vid: bcVideo) => {
    const mp4Src = vid.sources?.find((s) => s.container === "MP4");
    if (!mp4Src || !mp4Src.size)
      return {
        mb: "0",
        duration: "0",
      };
    const mb = (vid.mp4Src?.size / 1024 / 1024).toFixed(1);
    return {
      mb,
      duration: formatSeconds(vid.duration! / 1000),
    };
  };
  const playNext = () => {
    const curVidIdx = props.playlist.videos.findIndex(
      (curVid) => curVid.id === video().id
    );
    const nextVidIdx = curVidIdx + 1;
    if (nextVidIdx < props.playlist.videos.length) {
      setVideo(props.playlist.videos[nextVidIdx]);
    } else {
      setVideo(props.playlist.videos[0]);
    }
  };

  return (
    <div class="max-w-[1300px] mx-auto">
      <PlaylistTitle name={props.playlist.name!} />

      <PlayerPositioner
        playNext={playNext}
        resolvedVideoSrc={resolvedVideoSrc}
        video={video}
      />
      <div class="flex md:flex-row flex-col ">
        <BookList books={books} switchBook={switchBook} video={video} />
        <ChaptersList
          chapters={chapters}
          setVideo={setVideo}
          vidDetails={vidDetails}
          savedOffline={savedOffline}
          saveVidOffline={saveVidOffline}
          removeVidIndexedDb={removeVidIndexedDb}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

type titleProps = {
  name: string;
};
function PlaylistTitle(props: titleProps) {
  return (
    <h1 class="text-4xl text-center font-bold w-full pb-8">{props.name}</h1>
  );
}

type PlayerPositionerProps = {
  video: Accessor<bcVideo>;
  playNext: () => void;
  resolvedVideoSrc: Resource<string>;
};
function PlayerPositioner(props: PlayerPositionerProps) {
  return (
    <div class="fixed bottom-0 left-0 w-full">
      <div class="p-2 md:(py-6 px-3) m-2 rounded-lg shadow-md  shadow-gray-800 border-gray-200 bg-white">
        <div class="md:w-11/12 mx-auto text-center h-40 md:h-30 md:(flex items-end justify-between)">
          <Suspense>
            <Player
              vid={props.video()}
              playNext={props.playNext}
              resolvedSrc={props.resolvedVideoSrc}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
type BookListProps = {
  books: string[];
  video: Accessor<bcVideo>;
  switchBook: (book: string) => void;
};
function BookList(props: BookListProps) {
  return (
    <nav class=" md:(w-1/4 border-r border-black) max-h-[calc(100vh-7.5rem)] overflow-auto ">
      <ul class="flex flex-row md:(flex-col pb-70) overflow-auto">
        <For each={props.books}>
          {(book) => (
            <li
              class={`hover:bg-blue-700 hover:text-white text-lg border-dark  px-1 md:px-0 border md:(border-0 border-b) md:last:border-0 ${
                book == props.video().custom_fields?.localized_book_name
                  ? "bg-blue-700 text-white"
                  : ""
              }`}
            >
              <button
                class="w-full text-left p-2"
                onClick={() => props.switchBook(book)}
              >
                {book}
              </button>
            </li>
          )}
        </For>
      </ul>
    </nav>
  );
}
type ChaptersListProps = {
  chapters: () => bcVideo[];
  setVideo: Setter<bcVideo>;
  vidDetails: (vid: bcVideo) => {
    mb: string;
    duration: string;
  };
  savedOffline: Accessor<string[]>;
  saveVidOffline(vid: bcVideo): Promise<void>;
  removeVidIndexedDb(vid: bcVideo): Promise<void>;
  isLoading: Accessor<string[]>;
};
function ChaptersList(props: ChaptersListProps) {
  return (
    <div class="md:px-8 w-full max-h-[calc(100vh-7.5rem)] overflow-auto ">
      {/* Table headers */}
      <div class="p-1 grid grid-cols-4 sticky top-0 md:w-11/12 bg-white">
        <p>Chapter</p>
        <p>Size</p>
        <p>Length</p>
        <p>Saved</p>
      </div>
      <nav class="md:w-11/12 pt-2">
        <ul class="flex flex-col list-none gap-3 p-0  pb-70  w-full">
          <For each={props.chapters()}>
            {(chap) => (
              <li class="justify-evenl w-full flex justify-between">
                <Button
                  class="grid grid-cols-4 w-full focus:(ring-2 ring-inset-2 ring-blue-700  outline-none) hover:(bg-blue-200) px-2 py-1"
                  onClick={() => props.setVideo(chap)}
                  as="div"
                  data-name="chapter"
                >
                  <p class="">{Number(chap.custom_fields.chapter)}</p>
                  <p class="">{props.vidDetails(chap).mb} MB</p>
                  <p class="">{props.vidDetails(chap).duration}</p>
                  <ToggleButton
                    class="text-2xl w-fit"
                    data-name="toggle-saved"
                    pressed={props.savedOffline().includes(chap.id!)}
                    onClick={(event) => {
                      // Using on click instead of on change to to stop propagation.
                      event.stopImmediatePropagation();
                      const target = event.currentTarget;
                      const isPressed = target.getAttribute("aria-pressed");
                      if (isPressed == "false") {
                        props.saveVidOffline(chap);
                      } else {
                        props.removeVidIndexedDb(chap);
                      }
                    }}
                  >
                    <Show when={!props.isLoading().includes(chap.id!)}>
                      <MaterialSymbolsFavorite
                        class={`${
                          props.savedOffline().includes(chap.id!)
                            ? "color-green-700"
                            : "color-transparent stroke-green-700 hover:color-green-500"
                        }`}
                      />
                    </Show>
                    <Show when={props.isLoading().includes(chap.id!)}>
                      <span class="animate-spin duration-200 block transform w-max">
                        <MdiLoading />
                      </span>
                    </Show>
                  </ToggleButton>
                </Button>
              </li>
            )}
          </For>
        </ul>
      </nav>
    </div>
  );
}
