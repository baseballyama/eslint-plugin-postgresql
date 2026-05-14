import rule from "../src/rules/consistent-identity-over-serial.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "consistent-identity-over-serial",
  rule,
  "should enforce the configured stance on identity-over-serial",
);
