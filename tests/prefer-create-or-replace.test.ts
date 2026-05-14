import rule from "../src/rules/prefer-create-or-replace.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-create-or-replace",
  rule,
  "Prefer CREATE OR REPLACE for FUNCTION / PROCEDURE / VIEW",
);
