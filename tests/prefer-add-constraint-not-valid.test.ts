import rule from "../src/rules/prefer-add-constraint-not-valid.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-add-constraint-not-valid",
  rule,
  "Prefer ADD CONSTRAINT ... NOT VALID then VALIDATE separately",
);
