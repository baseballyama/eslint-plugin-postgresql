import rule from "../src/rules/prefer-jsonb-over-json.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-jsonb-over-json",
  rule,
  "should prefer jsonb over json column type",
);
