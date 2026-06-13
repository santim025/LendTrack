import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./__tests__/setup.ts"],
    include: ["__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "lib/**/*.ts",
        "app/api/**/*.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "**/setup.ts",
        "lib/prisma.ts",
        "lib/utils.ts",
        "lib/auth.ts",
        "lib/reports/send-email.ts",
        "app/api/auth/**",
      ],
      thresholds: {
        lines: 90,
        branches: 88,
        functions: 84,
        statements: 90,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
