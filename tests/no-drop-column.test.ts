import rule from "../src/rules/no-drop-column.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-drop-column", rule, "should disallow DROP COLUMN");
