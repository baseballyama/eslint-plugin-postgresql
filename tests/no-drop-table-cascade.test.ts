import rule from "../src/rules/no-drop-table-cascade.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-drop-table-cascade", rule, "should disallow DROP ... CASCADE");
