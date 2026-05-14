import rule from "../src/rules/no-add-check-constraint-without-not-valid.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-add-check-constraint-without-not-valid",
  rule,
  "Disallow ADD CONSTRAINT CHECK without NOT VALID",
);
