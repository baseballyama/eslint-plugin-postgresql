import rule from "../src/rules/no-add-column-not-null-without-default.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-add-column-not-null-without-default",
  rule,
  "should require DEFAULT when adding a NOT NULL column",
);
