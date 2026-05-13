import rule from "../src/rules/prefer-text-over-varchar.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-text-over-varchar",
  rule,
  "should prefer text over varchar(n)",
);
