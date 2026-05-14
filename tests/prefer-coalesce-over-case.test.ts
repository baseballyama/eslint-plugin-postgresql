import rule from "../src/rules/prefer-coalesce-over-case.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-coalesce-over-case",
  rule,
  "should flag CASE patterns equivalent to COALESCE",
);
