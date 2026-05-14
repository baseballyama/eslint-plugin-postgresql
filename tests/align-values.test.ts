import rule from "../src/rules/align-values.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "align-values",
  rule,
  "Align column values vertically inside multi-row VALUES",
);
