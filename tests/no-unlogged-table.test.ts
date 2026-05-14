import rule from "../src/rules/no-unlogged-table.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-unlogged-table", rule, "should disallow CREATE UNLOGGED TABLE");
