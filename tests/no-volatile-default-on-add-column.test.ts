import rule from "../src/rules/no-volatile-default-on-add-column.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-volatile-default-on-add-column",
  rule,
  "Disallow ADD COLUMN with VOLATILE function DEFAULT",
);
