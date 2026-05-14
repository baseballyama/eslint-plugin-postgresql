import rule from "../src/rules/prefer-current-timestamp-over-now.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-current-timestamp-over-now",
  rule,
  "Prefer the SQL-standard CURRENT_TIMESTAMP over now()",
);
