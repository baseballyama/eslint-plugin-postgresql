import rule from "../src/rules/prefer-keyword-case.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-keyword-case",
  rule,
  "Enforce a consistent case (upper or lower) for SQL keywords",
);
