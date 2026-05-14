import rule from "../src/rules/no-alter-column-type.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-alter-column-type",
  rule,
  "should disallow ALTER COLUMN ... TYPE",
);
