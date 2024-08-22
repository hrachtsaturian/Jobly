import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
    },
    rules: {},
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser, // Use globals from the browser environment
        ...globals.jest,
        fail: "readonly"
      },
    },
  },
  pluginJs.configs.recommended,
];
