import rule from "../src/rules/no-syntax-error.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-syntax-error",
  rule,
  "should validate PostgreSQL syntax in SQL files",
);
