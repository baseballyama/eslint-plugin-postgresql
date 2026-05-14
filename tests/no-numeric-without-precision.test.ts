import rule from "../src/rules/no-numeric-without-precision.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-numeric-without-precision",
  rule,
  "should require precision on NUMERIC/DECIMAL",
);
