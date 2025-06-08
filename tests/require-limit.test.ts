import rule from "../src/rules/require-limit.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "require-limit",
  rule,
  "should require LIMIT clause in SELECT statements",
);
