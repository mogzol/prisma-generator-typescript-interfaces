// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config({
  files: ["*.ts"],
  extends: [
    eslint.configs.recommended,
    eslintConfigPrettier,
    ...tseslint.configs.recommendedTypeChecked,
  ],
  rules: {
    "@typescript-eslint/restrict-template-expressions": ["error", { allowNever: true }],
  },
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
