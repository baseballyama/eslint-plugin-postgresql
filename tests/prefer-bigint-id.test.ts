import rule from "../src/rules/prefer-bigint-id.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "prefer-bigint-id",
  rule,
  "should prefer bigint for primary-key id columns",
);
