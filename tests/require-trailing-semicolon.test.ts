import rule from "../src/rules/require-trailing-semicolon.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "require-trailing-semicolon",
  rule,
  "Require a trailing semicolon at the end of every statement",
);
