import rule from "../src/rules/snake-case-table-name.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "snake-case-table-name",
  rule,
  "should require snake_case table names",
);
