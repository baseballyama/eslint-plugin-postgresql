import rule from "../src/rules/prefer-not-equals-operator.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-not-equals-operator",
  rule,
  "Enforce a single style for the not-equal operator",
);
