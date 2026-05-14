import rule from "../src/rules/consistent-fk-not-valid.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "consistent-fk-not-valid",
  rule,
  "should enforce the configured stance on fk-not-valid",
);
