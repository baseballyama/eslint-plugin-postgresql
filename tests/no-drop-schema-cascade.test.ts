import rule from "../src/rules/no-drop-schema-cascade.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-drop-schema-cascade",
  rule,
  "should disallow DROP SCHEMA ... CASCADE",
);
