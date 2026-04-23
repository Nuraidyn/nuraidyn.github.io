import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";

export default [
  js.configs.recommended,
  {
    plugins: { react: reactPlugin },
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        URL: "readonly",
        Blob: "readonly",
        Intl: "readonly",
        Math: "readonly",
        Number: "readonly",
        String: "readonly",
        Object: "readonly",
        Array: "readonly",
        Promise: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        AbortController: "readonly",
        AbortSignal: "readonly",
        IntersectionObserver: "readonly",
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      // JSX usage is not detected by ESLint's no-unused-vars for React components
      "no-unused-vars": "off",
      "no-console": "off",
      // react-hooks plugin not installed — disable hook rules
      "react-hooks/exhaustive-deps": "off",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**"],
  },
];
