import rule from "../src/rules/no-create-role.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-create-role",
  rule,
  "should disallow CREATE ROLE / CREATE USER",
);
