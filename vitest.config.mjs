import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.{mjs,js}"],
    coverage: {
      reporter: ["text", "html"],
      include: ["lib/**", "src/hooks/**", "scripts/migrate-app-state-to-per-team.mjs"],
    },
  },
});
