import rule from "../src/rules/no-drop-database.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-drop-database", rule, "should disallow DROP DATABASE");
