import rule from "../src/rules/no-equality-with-null.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-equality-with-null",
  rule,
  "Disallow x = NULL / x <> NULL; use IS NULL / IS NOT NULL",
);
