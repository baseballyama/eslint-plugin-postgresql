import rule from "../src/rules/no-update-primary-key.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-update-primary-key",
  rule,
  "Disallow UPDATE on primary-key columns (heuristic: id, <table>_id, plus user-provided names)",
);
