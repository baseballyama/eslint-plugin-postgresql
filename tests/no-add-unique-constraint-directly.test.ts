import rule from "../src/rules/no-add-unique-constraint-directly.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-add-unique-constraint-directly",
  rule,
  "Disallow inline ADD CONSTRAINT UNIQUE; require USING INDEX",
);
