import rule from "../src/rules/no-with-recursive-without-limit.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-with-recursive-without-limit",
  rule,
  "Disallow WITH RECURSIVE without an outer LIMIT",
);
