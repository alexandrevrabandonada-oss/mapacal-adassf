import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const ignorePatterns = {
  ignores: [
    ".next/**",
    "node_modules/**",
    "out/**",
    "dist/**",
    "next-env.d.ts",
    "tsconfig.tsbuildinfo",
    ".git/**",
    "tools/_patch_backup/**"
  ]
};

const config = [
  ignorePatterns,
  ...compat.extends("next/core-web-vitals", "next/typescript")
];

export default config;
