import rule from "../src/rules/consistent-as-for-table-alias.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "consistent-as-for-table-alias",
  rule,
  "should enforce the configured stance on as-for-table-alias",
);
