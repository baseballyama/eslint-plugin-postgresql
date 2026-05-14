import rule from "../src/rules/prefer-in-list-over-or.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-in-list-over-or",
  rule,
  "Prefer x IN (...) over x = a OR x = b",
);
