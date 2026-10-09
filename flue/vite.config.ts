import { cloudflare } from "@cloudflare/vite-plugin";
import { flue, flueWorkerConfig } from "@flue/vite";
import { defineConfig } from "vite";

// flue() must come before cloudflare().
export default defineConfig({
  plugins: [flue(), cloudflare({ config: flueWorkerConfig() })],
  server: { port: 8787, strictPort: true },
  // Worker deps must be listed up front. A later optimize pass restarts workerd
  // before the Durable Object class exists.
  environments: {
    ieum_flue: {
      optimizeDeps: {
        include: [
          "@flue/runtime",
          "@flue/runtime/routing",
          "@flue/runtime/internal",
          "@flue/runtime/cloudflare/internal",
          "@flue/runtime/cloudflare/workers-ai",
          "agents",
          "hono",
          "hono/bearer-auth",
          "valibot",
        ],
      },
    },
  },
});
