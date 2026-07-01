import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  external: ["react", "react-dom", "lucide-react"],
  banner: {
    js: '"use client";',
  },
});
