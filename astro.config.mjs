import {defineConfig} from "astro/config";
import AstroPWA from "@vite-pwa/astro";
import UnoCSS from "unocss/astro";
import solidJs from "@astrojs/solid-js";
import cloudflare from "@astrojs/cloudflare";
import transformerVariantGroup from "@unocss/transformer-variant-group";

// https://astro.build/config
export default defineConfig({
  output: "server",
  devToolbar: {
    enabled: false,
  },
  adapter: cloudflare({
    mode: "directory",
  }),
  integrations: [
    AstroPWA({
      workbox: {
        disableDevLogs: true,
      },
      srcDir: "src",
      filename: "sw.ts",
      strategies: "injectManifest",
      registerType: "autoUpdate",
      // manifest: {},
      devOptions: {
        enabled: false,
        type: "module",
        /* other options */
      },
      injectManifest: {
        globIgnores: [
          "**/node_modules/**/*",
          "$server_build/*",
          "$server_build/**/*",
        ],
      },
    }),
    UnoCSS({
      injectReset: true,
      transformers: [transformerVariantGroup()],
    }),
    solidJs(),
  ],
});
