import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"]
  },
  {
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/set-state-in-effect": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn"
    }
  }
];
