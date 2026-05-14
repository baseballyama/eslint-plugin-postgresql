import rule from "../src/rules/prefer-cast-operator.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-cast-operator",
  rule,
  "Enforce a single style for type casts",
);
