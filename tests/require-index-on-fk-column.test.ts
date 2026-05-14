import rule from "../src/rules/require-index-on-fk-column.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "require-index-on-fk-column",
  rule,
  "Require an index on every foreign-key column",
);
