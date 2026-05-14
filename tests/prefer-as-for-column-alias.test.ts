import rule from "../src/rules/prefer-as-for-column-alias.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-as-for-column-alias",
  rule,
  "Require AS before column aliases in SELECT",
);
