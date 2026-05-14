import rule from "../src/rules/no-rule.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-rule",
  rule,
  "Disallow CREATE RULE; PostgreSQL's rule system is effectively deprecated",
);
