import rule from "../src/rules/require-named-constraint.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "require-named-constraint",
  rule,
  "should require an explicit constraint name",
);
