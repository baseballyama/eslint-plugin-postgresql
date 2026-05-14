import rule from "../src/rules/prefer-as-for-table-alias.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-as-for-table-alias",
  rule,
  "Require AS before table aliases",
);
