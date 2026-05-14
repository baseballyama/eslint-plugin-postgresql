import rule from "../src/rules/no-select-into.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-select-into", rule, "should disallow SELECT ... INTO target");
