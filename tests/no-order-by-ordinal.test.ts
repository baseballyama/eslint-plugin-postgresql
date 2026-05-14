import rule from "../src/rules/no-order-by-ordinal.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-order-by-ordinal",
  rule,
  "should disallow positional ORDER BY references",
);
