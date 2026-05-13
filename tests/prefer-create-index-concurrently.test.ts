import rule from "../src/rules/prefer-create-index-concurrently.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-create-index-concurrently",
  rule,
  "should prefer CREATE INDEX CONCURRENTLY",
);
