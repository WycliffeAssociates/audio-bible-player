import {registerSW} from "virtual:pwa-register";

// 5 minute
const intervalMS = 5 * 60 * 1000;
// https://vite-pwa-org.netlify.app/guide/periodic-sw-updates.html#periodic-service-worker-updates
console.log("calling first registerSW");
registerSW({
  onRegisteredSW(swUrl, r) {
    r &&
      setInterval(async () => {
        if (!(!r.installing && navigator)) return;

        if ("connection" in navigator && !navigator.onLine) return;
        console.log("updating sw", swUrl);
        const resp = await fetch(swUrl, {
          cache: "no-store",
          headers: {
            cache: "no-store",
            "cache-control": "no-cache",
          },
        });

        if (resp?.status === 200) await r.update();
      }, intervalMS);
  },
  onRegisterError(error) {
    console.error(error);
  },
  onNeedRefresh() {
    // window.location.reload();
    console.log("onNeedRefresh");
  },
  onOfflineReady() {
    console.log("onOfflineReady");
  },
});
