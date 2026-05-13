import rule from "../src/rules/require-primary-key.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "require-primary-key",
  rule,
  "should require a PRIMARY KEY in CREATE TABLE",
);
