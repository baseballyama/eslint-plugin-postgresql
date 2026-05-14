import rule from "../src/rules/prefer-explicit-outer-join.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-explicit-outer-join",
  rule,
  "Require OUTER to be written explicitly in LEFT/RIGHT/FULL OUTER JOIN",
);
