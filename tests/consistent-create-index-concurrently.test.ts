import rule from "../src/rules/consistent-create-index-concurrently.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "consistent-create-index-concurrently",
  rule,
  "should enforce the configured stance on CREATE INDEX CONCURRENTLY",
);
