import rule from "../src/rules/require-fk-include-columns.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "require-fk-include-columns",
  rule,
  "Require FK constraints to include configured columns (e.g. tenant_id)",
);
