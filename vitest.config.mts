import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Щоб у тестах працювали імпорти "@/lib/..." так само, як у Next.js
    tsconfigPaths: true,
  },
  test: {
    // Шукаємо тести лише в нашому коді, а не в node_modules чи .next
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
  },
});
