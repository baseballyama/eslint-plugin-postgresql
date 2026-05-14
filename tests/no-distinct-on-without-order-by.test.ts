import rule from "../src/rules/no-distinct-on-without-order-by.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-distinct-on-without-order-by",
  rule,
  "should require ORDER BY alongside DISTINCT ON",
);
