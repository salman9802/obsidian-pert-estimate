import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	test: {
		alias: {
			obsidian: resolve(rootDir, "src/tests/mocks/obsidian.ts")
		}
	}
});
