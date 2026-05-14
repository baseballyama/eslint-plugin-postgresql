import rule from "../src/rules/prefer-fk-not-valid.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-fk-not-valid",
  rule,
  "should require NOT VALID when adding a foreign key",
);
