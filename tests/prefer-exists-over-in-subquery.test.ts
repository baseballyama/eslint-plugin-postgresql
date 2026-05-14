import rule from "../src/rules/prefer-exists-over-in-subquery.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-exists-over-in-subquery",
  rule,
  "Prefer EXISTS over IN (subquery)",
);
