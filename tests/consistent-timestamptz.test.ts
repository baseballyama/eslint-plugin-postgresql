import rule from "../src/rules/consistent-timestamptz.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "consistent-timestamptz",
  rule,
  "should enforce the configured stance on timestamptz vs timestamp",
);
