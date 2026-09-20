import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// ESLint 9 flat config. `next lint` was removed in Next 16, so linting runs
// through the ESLint CLI against the configs eslint-config-next now exports
// natively in flat form.
const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "convex/_generated/**",
      // Plain Node utilities, not part of the app bundle.
      "scripts/**",
    ],
  },
  {
    rules: {
      // New in the Next 16 / React Compiler ruleset. The existing effects
      // predate it and work; kept visible as warnings to be worked through
      // rather than failing the build on day one of the upgrade.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
  {
    // Config files legitimately use CommonJS plugin loading.
    files: ["*.config.{js,ts,mjs,cjs}"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];

export default config;
