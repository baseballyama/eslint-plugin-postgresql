import rule from "../src/rules/consistent-drop-index-concurrently.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "consistent-drop-index-concurrently",
  rule,
  "should enforce the configured stance on drop-index-concurrently",
);
