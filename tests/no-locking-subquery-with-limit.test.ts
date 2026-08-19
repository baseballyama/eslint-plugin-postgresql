import rule from "../src/rules/no-locking-subquery-with-limit.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-locking-subquery-with-limit",
  rule,
  "should disallow a locking sub-SELECT with LIMIT inside UPDATE / DELETE",
);
