import rule from "../src/rules/require-where-in-delete.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "require-where-in-delete",
  rule,
  "should require WHERE in DELETE statements",
);
