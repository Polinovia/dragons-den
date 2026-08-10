import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Privacy boundary: only lib/server/** may query content models directly.
    // Everything else (pages, components, server actions) must go through those
    // helpers, so visibility filtering can never be accidentally skipped.
    files: ["src/app/**/*.{ts,tsx}", "src/actions/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/prisma",
              message: "Query content models through @/lib/server/* helpers, not prisma directly, so visibility filtering can't be bypassed.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
