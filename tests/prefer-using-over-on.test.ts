import rule from "../src/rules/prefer-using-over-on.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-using-over-on",
  rule,
  "should prefer USING over ON for same-named columns",
);
