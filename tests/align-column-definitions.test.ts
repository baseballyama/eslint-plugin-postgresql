import rule from "../src/rules/align-column-definitions.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "align-column-definitions",
  rule,
  "Align column definitions vertically inside CREATE TABLE",
);
