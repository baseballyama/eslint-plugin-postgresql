import postgresqlPlugin from "./dist/index.js";

export default [
  {
    files: ["**/*.sql"],
    ...postgresqlPlugin.configs.recommended,
  },
];
