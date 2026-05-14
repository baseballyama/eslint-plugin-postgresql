import rule from "../src/rules/require-if-exists.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "require-if-exists",
  rule,
  "Require IF EXISTS on every DROP statement",
);
