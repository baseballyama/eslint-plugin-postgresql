import rule from "../src/rules/prefer-reindex-concurrently.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-reindex-concurrently",
  rule,
  "should require REINDEX CONCURRENTLY",
);
