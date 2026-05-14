import rule from "../src/rules/require-on-delete-action.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "require-on-delete-action",
  rule,
  "Require an explicit ON DELETE clause on every foreign-key constraint",
);
