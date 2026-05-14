import rule from "../src/rules/no-temporary-table.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-temporary-table",
  rule,
  "should disallow CREATE TEMPORARY TABLE",
);
