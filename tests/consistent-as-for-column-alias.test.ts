import rule from "../src/rules/consistent-as-for-column-alias.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "consistent-as-for-column-alias",
  rule,
  "should enforce the configured stance on as-for-column-alias",
);
