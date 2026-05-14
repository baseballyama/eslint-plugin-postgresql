import rule from "../src/rules/prefer-explicit-null-ordering.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-explicit-null-ordering",
  rule,
  "should require NULLS FIRST/LAST when an explicit ORDER BY direction is given",
);
