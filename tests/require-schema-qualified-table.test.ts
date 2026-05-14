import rule from "../src/rules/require-schema-qualified-table.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "require-schema-qualified-table",
  rule,
  "should require schema-qualified CREATE TABLE",
);
