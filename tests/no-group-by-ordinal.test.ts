import rule from "../src/rules/no-group-by-ordinal.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-group-by-ordinal",
  rule,
  "should disallow positional GROUP BY references",
);
