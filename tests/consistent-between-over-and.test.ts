import rule from "../src/rules/consistent-between-over-and.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "consistent-between-over-and",
  rule,
  "should enforce the configured stance on between-over-and",
);
