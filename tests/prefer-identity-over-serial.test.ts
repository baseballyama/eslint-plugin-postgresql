import rule from "../src/rules/prefer-identity-over-serial.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-identity-over-serial",
  rule,
  "should prefer GENERATED AS IDENTITY over serial types",
);
