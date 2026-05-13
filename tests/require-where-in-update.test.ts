import rule from "../src/rules/require-where-in-update.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "require-where-in-update",
  rule,
  "should require WHERE in UPDATE statements",
);
