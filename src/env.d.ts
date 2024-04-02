/// <reference types="astro/client" />
/// <reference types="vite-plugin-pwa/client" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    runtime: {
      env: Record<any, any>;
    };
  }
}
