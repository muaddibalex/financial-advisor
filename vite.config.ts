import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";

// base relativ: pe GitHub Pages aplicatia este servita sub /<nume-repo>/, nu la radacina.
export default defineConfig({
  base: "./",
  plugins: [preact()],
  test: {
    environment: "jsdom",
    include: ["teste/**/*.test.{ts,tsx}"],
  },
});
