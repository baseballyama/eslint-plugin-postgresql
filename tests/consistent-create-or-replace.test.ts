import rule from "../src/rules/consistent-create-or-replace.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "consistent-create-or-replace",
  rule,
  "Enforce a consistent stance on CREATE OR REPLACE for FUNCTION / PROCEDURE / VIEW",
);
