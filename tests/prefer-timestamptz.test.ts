import rule from "../src/rules/prefer-timestamptz.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-timestamptz",
  rule,
  "should prefer timestamptz over timestamp",
);
