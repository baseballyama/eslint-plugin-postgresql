import rule from "../src/rules/no-truncate-cascade.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-truncate-cascade",
  rule,
  "should disallow TRUNCATE ... CASCADE",
);
