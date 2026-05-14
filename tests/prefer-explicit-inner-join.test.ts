import rule from "../src/rules/prefer-explicit-inner-join.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-explicit-inner-join",
  rule,
  "Require INNER JOIN instead of bare JOIN",
);
