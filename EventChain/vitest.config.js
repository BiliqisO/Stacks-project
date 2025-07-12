/// <reference types="vitest" />

import { defineConfig } from "vite";

export default defineConfig({
  test: {
    environment: "clarinet",
    pool: "forks",
    poolOptions: {
      threads: { singleThread: true },
      forks: { singleFork: true },
    },
    environmentOptions: {
      clarinet: {
        manifestPath: "./Clarinet.toml",
      },
    },
  },
});
