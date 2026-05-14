import rule from "../src/rules/consistent-reindex-concurrently.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "consistent-reindex-concurrently",
  rule,
  "should enforce the configured stance on reindex-concurrently",
);
