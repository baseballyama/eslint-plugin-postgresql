import rule from "../src/rules/no-leading-wildcard-like.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-leading-wildcard-like",
  rule,
  "should disallow LIKE/ILIKE patterns that start with %",
);
