import {clientsClaim} from "workbox-core";
import {precacheAndRoute} from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;
self.__WB_DISABLE_DEV_LOGS = true;
self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);
