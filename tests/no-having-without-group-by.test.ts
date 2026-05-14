import rule from "../src/rules/no-having-without-group-by.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-having-without-group-by",
  rule,
  "should disallow HAVING without GROUP BY",
);
