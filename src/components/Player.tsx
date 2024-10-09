import type {bcVideo} from "@customTypes/types";
import {
  Show,
  createSignal,
  onMount,
  type Resource,
  type Setter,
  type Accessor,
} from "solid-js";
import {ToggleButton} from "@kobalte/core/toggle-button";
import {Progress} from "@kobalte/core/progress";
import {Slider} from "@kobalte/core/slider";
import {Button} from "@kobalte/core/button";
import type {DownloadVideo} from "@src/pages/api/downloadVideo";

import {
  FluentSkipBackward1048Filled,
  FluentSkipForward1048Filled,
  IconParkOutlineLoopOnce,
  MaterialSymbolsLightDownload2,
  MaterialSymbolsLightPause,
  MaterialSymbolsLightPlayArrow,
} from "./Icons";
import {
  defaultUserPrefs,
  formatSeconds,
  getUserPrefs,
  setPrefs,
  type userPrefs,
} from "@lib/utils";

type PlayerProps = {
  vid: bcVideo;
  playNext: () => void;
  resolvedSrc: Resource<string>;
};
export function Player(props: PlayerProps) {
  let progressRef!: HTMLDivElement;
  const [curTime, setCurTime] = createSignal(0);
  const [isScrubbing, setIsScrubbing] = createSignal(false);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [bufferedAmt, setBufferedAmt] = createSignal(0);
  const [audioEl, setAudioEl] = createSignal<HTMLAudioElement>() as [
    Accessor<HTMLAudioElement>,
    Setter<HTMLAudioElement>
  ];

  const [userPrefs, setUserPrefs] = createSignal(
    import.meta.env.SSR ? defaultUserPrefs : getUserPrefs()
  );

  const vidTimeSeconds = () => props.vid.duration! / 1000;
  const progressAmount = () => {
    const amt = curTime() / vidTimeSeconds();
    return amt;
  };

  onMount(() => {
    if (typeof window !== "undefined") {
      // some keyboard shortcutes
      const keyListener = (event: KeyboardEvent) => {
        if (audioEl()) {
          if (event.code === "ArrowRight") {
            audioEl().currentTime += 10;
          } else if (event.code === "ArrowLeft") {
            audioEl().currentTime -= 10;
          }
        }
      };
      window.addEventListener("keydown", keyListener);

      // scrub
      const moveListener = (event: MouseEvent) => {
        if (!isScrubbing()) return;
        if (!progressRef) return;
        const barWidth = progressRef.offsetWidth;
        // const target = event.currentTarget as HTMLElement;
        const newClickOffset =
          event.clientX - progressRef.getBoundingClientRect()?.left;
        const newClickPercent = newClickOffset / barWidth;
        if (audioEl()) {
          audioEl().currentTime = newClickPercent * vidTimeSeconds();
        }
      };
      window.addEventListener("mousemove", moveListener);
      window.addEventListener("mouseup", () => setIsScrubbing(false));

      // set playback rate
      audioEl().playbackRate = userPrefs().speed[0];

      // cleanup
      return () => {
        if (typeof window !== "undefined") {
          window.removeEventListener("keydown", keyListener);
          window.removeEventListener("mousemove", moveListener);
        }
      };
    }
  });

  function seek(dir: "forward" | "backward") {
    if (audioEl()) {
      audioEl()!.currentTime += dir === "forward" ? 10 : -10;
    }
  }

  const downloadUrlComponent: () => DownloadVideo = () => {
    return {
      name: props.vid.custom_fields.localized_book_name,
      url: props.vid.mp4Src.src,
      size: props.vid.mp4Src.size,
    };
    // return JSON.stringify({
    //   url: props.vid.mp4Src.src,
    //   name:
    //     props.vid.custom_fields.localized_book_name +
    //     " " +
    //     props.vid.custom_fields.chapter,
    //   size: props.vid.mp4Src.size,
    // });
  };

  return (
    <>
      <PlayerBookChapterDisplay vid={props.vid} />
      <AudioElement
        audioEl={audioEl}
        ref={setAudioEl}
        setIsPlaying={setIsPlaying}
        setCurTime={setCurTime}
        setBufferedAmt={setBufferedAmt}
        userPrefs={userPrefs}
        playNext={props.playNext}
        resolvedSrc={props.resolvedSrc}
      />

      <PlayerControls
        audioEl={audioEl}
        curTime={curTime}
        progressRef={progressRef}
        isPlaying={isPlaying}
        seek={seek}
        setIsScrubbing={setIsScrubbing}
        bufferedAmt={bufferedAmt}
        progressAmount={progressAmount}
        vidTimeSeconds={vidTimeSeconds}
      />
      <AdditionalVidControls
        userPrefs={userPrefs}
        audioEl={audioEl}
        downloadUrlComponent={downloadUrlComponent}
        setUserPrefs={setUserPrefs}
      />
    </>
  );
}

type PlayerBookChapterDisplayProps = {
  vid: bcVideo;
};
function PlayerBookChapterDisplay(props: PlayerBookChapterDisplayProps) {
  return (
    <h2 class="text-xl md:text-2xl">
      {props.vid.custom_fields.localized_book_name}{" "}
      {Number(props.vid.custom_fields.chapter)}
    </h2>
  );
}

type AudioElProps = {
  ref: Setter<HTMLAudioElement>;
  audioEl: Accessor<HTMLAudioElement>;
  setCurTime: Setter<number>;
  setBufferedAmt: Setter<number>;
  setIsPlaying: Setter<boolean>;
  userPrefs: Accessor<userPrefs>;
  playNext: () => void;
  resolvedSrc: Resource<string>;
};
function AudioElement(props: AudioElProps) {
  return (
    <audio
      onTimeUpdate={() => props.setCurTime(props.audioEl().currentTime)}
      onPlay={() => props.setIsPlaying(true)}
      onPause={() => props.setIsPlaying(false)}
      onEmptied={() => {
        // if (props.ref) {
        props.audioEl()?.pause();
        props.setIsPlaying(false);
        // }
      }}
      onEnded={() => {
        if (props.userPrefs().autoplay) {
          props.playNext();
          props.audioEl().addEventListener(
            "loadeddata",
            () => {
              props.audioEl().play();
            },
            {once: true}
          );
        }
      }}
      onProgress={(e) => {
        const duration = props.audioEl().duration;
        if (duration > 0) {
          // Loop through buffered segments
          for (let i = 0; i < props.audioEl().buffered.length; i++) {
            // Get the start time of the current buffered segment
            const startTime = props
              .audioEl()
              .buffered.start(props.audioEl().buffered.length - 1 - i);

            // Check if the current segment starts before or at the current playback time
            if (startTime <= props.audioEl().currentTime) {
              // Calculate the percentage of the segment that is buffered
              const bufferedPercentage =
                (props
                  .audioEl()
                  .buffered.end(props.audioEl().buffered.length - 1 - i) *
                  100) /
                duration;
              console.log({bufferedPercentage});
              props.setBufferedAmt(bufferedPercentage);

              // Break the loop once a buffered segment is found that starts before or at the current playback time
              break;
            }
          }
        }
      }}
      controls
      src={props.resolvedSrc()}
      ref={props.ref}
      class="hidden pointer-events-none"
      tabIndex={-1}
    ></audio>
  );
}

type PlayerControlsProps = {
  seek(dir: "forward" | "backward"): void;
  audioEl: Accessor<HTMLAudioElement>;
  isPlaying: Accessor<boolean>;
  vidTimeSeconds: Accessor<number>;
  bufferedAmt: Accessor<number>;
  curTime: Accessor<number>;
  progressAmount: () => number;
  setIsScrubbing: Setter<boolean>;
  progressRef: HTMLDivElement;
};
function PlayerControls(props: PlayerControlsProps) {
  return (
    <div class="flex flex-col md:w-5/6">
      <div class="flex items-center gap-2 justify-center  text-2xl md:text-4xl ">
        <button
          class="hover:text-blue-700 focus:(ring ring-offset-3 ring-blue-700 ring-offset-transparent outline-none)"
          onClick={() => props.seek("backward")}
        >
          <FluentSkipBackward1048Filled />
        </button>
        <button
          class="hover:text-blue-700 focus:(ring ring-offset-3 ring-blue-700 ring-offset-transparent outline-none)"
          onClick={() =>
            props.audioEl()?.paused
              ? props.audioEl()?.play()
              : props.audioEl()?.pause()
          }
        >
          <span class="text-5xl">
            <Show
              when={!props.isPlaying()}
              fallback={<MaterialSymbolsLightPause />}
            >
              <MaterialSymbolsLightPlayArrow />
            </Show>
          </span>
        </button>
        <button
          class="hover:text-blue-700 focus:(ring ring-offset-3 ring-blue-700 ring-offset-transparent outline-none)"
          onClick={() => props.seek("forward")}
        >
          <FluentSkipForward1048Filled />
        </button>
      </div>
      <Progress
        minValue={0}
        maxValue={1}
        value={props.progressAmount()}
        getValueLabel={() => formatSeconds(props.curTime())}
        class="rounded-full "
      >
        <Progress.Label />
        <div class="flex  items-center gap-4">
          <span class="inline-block w-8ch">
            <Progress.ValueLabel />
          </span>

          <Progress.Track
            ref={props.progressRef}
            class="relative w-full h-15px bg-gray-400 rounded-full "
            onMouseDown={(event: MouseEvent) => {
              const target = event.target as HTMLElement;
              const currentTarget = event.currentTarget as HTMLElement;
              if (!target || !currentTarget) return;
              props.setIsScrubbing(true);
              if (target.dataset.role === "progress-thumb") {
                return;
              }
              const barWidth = currentTarget.clientWidth;
              const clickOffset =
                event.clientX - currentTarget.getBoundingClientRect().left;
              const clickPercentage = clickOffset / barWidth;
              props.audioEl().currentTime =
                clickPercentage * props.vidTimeSeconds();
            }}
          >
            <Progress.Fill
              class="bg-blue-600 h-full z-5 relative rounded-full "
              style={{width: `${props.progressAmount() * 100}%`}}
            />
            <div
              data-role="progress-thumb"
              class="absolute top-0 -translate-x-50% -translate-y-6px rounded-1/2  w-26px h-26px cursor-pointer z-10 bg-blue-600"
              style={{
                left: `${props.progressAmount() * 100}%`,
                "z-index": "10",
              }}
            ></div>
            <div
              class="absolute top-0 left-0 rounded-full z-1 bg-gray-700 h-full transition-width ease-linear duration-100"
              style={{width: `${props.bufferedAmt()}%`}}
            ></div>
          </Progress.Track>

          <div class="w-8ch">{formatSeconds(props.vidTimeSeconds())}</div>
        </div>
      </Progress>
    </div>
  );
}

type AdditionalControlsProps = {
  downloadUrlComponent: () => DownloadVideo;
  userPrefs: Accessor<userPrefs>;
  setUserPrefs: Setter<userPrefs>;
  audioEl: Accessor<HTMLAudioElement>;
};
function AdditionalVidControls(props: AdditionalControlsProps) {
  return (
    <div class="mt-4 flex items-center gap-6 justify-center">
      <span class="text-2xl hover:text-blue-700">
        <form action="/api/downloadVideo" method="post">
          <input
            type="hidden"
            name="payload"
            value={JSON.stringify(props.downloadUrlComponent())}
          />
          <button type="submit">
            <MaterialSymbolsLightDownload2 />
          </button>
        </form>
        {/* <Button
          onClick={() => {
            fetch("/api/downloadVideo", {
              method: "POST",
              body: JSON.stringify(props.downloadUrlComponent()),
            });
          }}
        >
        </Button> */}
        {/* <a href={`/sw-handle-saving?vid=${props.downloadUrlComponent()}`}>
        </a> */}
      </span>
      <span class="text-2xl font-bold">
        <ToggleButton
          class="toggle-button"
          aria-label="autoplay"
          pressed={props.userPrefs().autoplay}
          onChange={(value) => {
            const prefs = setPrefs("autoplay", value);
            props.setUserPrefs(prefs);
          }}
        >
          {(state) => (
            <IconParkOutlineLoopOnce
              class={`transition-200 transition-color ${
                state.pressed() ? "text-blue-500" : "text-gray-700"
              }`}
            />
          )}
        </ToggleButton>
      </span>

      <Slider
        class="relative flex flex-col items-center select-none touch-none w-100px"
        defaultValue={props.userPrefs().speed}
        minValue={0.25}
        maxValue={3}
        step={0.25}
        orientation="horizontal"
        onChange={(val) => {
          const prefs = setPrefs("speed", val);
          props.setUserPrefs(prefs);
          props.audioEl().playbackRate = val[0];
        }}
      >
        <Slider.Track
          data-name="slider-track"
          class="bg-gray-200 relative rounded-full w-full h-8px "
        >
          <Slider.Fill class="absolute bg-blue-700 rounded-full h-full" />
          <Slider.Thumb class="block w-16px h-16px bg-blue-300 rounded-full -bottom-4px">
            <Slider.Input />
          </Slider.Thumb>
        </Slider.Track>
        <div class="">
          {/* <Slider.Label>Volume {userPrefs().speed}</Slider.Label> */}
          <div class="flex">
            <Slider.ValueLabel /> x
          </div>
        </div>
      </Slider>
    </div>
  );
}
