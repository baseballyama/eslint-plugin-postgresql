import rule from "../src/rules/consistent-explicit-outer-join.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "consistent-explicit-outer-join",
  rule,
  "should enforce the configured stance on explicit-outer-join",
);
