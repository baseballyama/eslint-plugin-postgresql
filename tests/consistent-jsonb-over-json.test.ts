import rule from "../src/rules/consistent-jsonb-over-json.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "consistent-jsonb-over-json",
  rule,
  "should enforce the configured stance on jsonb-over-json",
);
