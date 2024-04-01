import {clientsClaim} from "workbox-core";
import {registerRoute} from "workbox-routing";
import {StaleWhileRevalidate, CacheFirst} from "workbox-strategies";
import {precacheAndRoute} from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;
self.__WB_DISABLE_DEV_LOGS = true;
self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("fetch", async (event) => {
  if (event.request.url.match(/sw-handle-saving/)) {
    // todo: get url from query param, then fetch it, then return the response as octet-strem to tirgger a download
    const url = new URL(event.request.url);
    const vidStringified = url.searchParams.get("vid");

    if (!vidStringified) return;
    const parsed = JSON.parse(vidStringified);
    event.respondWith(getFile(parsed));

    async function getFile(parsed: Record<string, string>) {
      console.log("SW GOING!");
      const response = await fetch(parsed.url);
      // const {readable, writable} = new TransformStream();
      // response.body?.pipeTo(writable);
      return new Response(response.body, {
        headers: {
          "Content-Type": "application/octet-stream; charset=utf-8",
          "Content-Disposition": `attachment; filename=${parsed.name}.mp4`,
          "Content-Length": `${parsed.size}`,
        },
      });
    }
  }
});
// cleanupOutdatedCaches();

// precacheAndRoute(self.__WB_MANIFEST);
