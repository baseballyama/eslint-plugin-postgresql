import rule from "../src/rules/prefer-drop-index-concurrently.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-drop-index-concurrently",
  rule,
  "Prefer DROP INDEX CONCURRENTLY",
);
