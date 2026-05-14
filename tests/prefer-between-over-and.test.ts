import rule from "../src/rules/prefer-between-over-and.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-between-over-and",
  rule,
  "Prefer x BETWEEN a AND b over x >= a AND x <= b",
);
