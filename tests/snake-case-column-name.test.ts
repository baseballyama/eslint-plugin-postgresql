import rule from "../src/rules/snake-case-column-name.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "snake-case-column-name",
  rule,
  "should require snake_case column names",
);
