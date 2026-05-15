import rule from "../src/rules/require-table-columns.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "require-table-columns",
  rule,
  "Require every CREATE TABLE to include a configured set of columns",
);
