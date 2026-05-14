import rule from "../src/rules/consistent-explicit-inner-join.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "consistent-explicit-inner-join",
  rule,
  "should enforce the configured stance on explicit-inner-join",
);
