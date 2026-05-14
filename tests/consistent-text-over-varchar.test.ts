import rule from "../src/rules/consistent-text-over-varchar.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "consistent-text-over-varchar",
  rule,
  "should enforce the configured stance on text-over-varchar",
);
