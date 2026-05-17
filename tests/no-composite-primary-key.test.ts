import rule from "../src/rules/no-composite-primary-key.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-composite-primary-key",
  rule,
  "should disallow composite PRIMARY KEY constraints",
);
