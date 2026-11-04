import rule from "../src/rules/consistent-exists-over-in-subquery.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "consistent-exists-over-in-subquery",
  rule,
  "should enforce the configured stance on exists-over-in-subquery",
);
