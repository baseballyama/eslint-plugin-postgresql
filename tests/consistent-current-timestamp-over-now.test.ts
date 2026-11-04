import rule from "../src/rules/consistent-current-timestamp-over-now.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "consistent-current-timestamp-over-now",
  rule,
  "should enforce the configured stance on CURRENT_TIMESTAMP-over-now",
);
