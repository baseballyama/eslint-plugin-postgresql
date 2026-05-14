import rule from "../src/rules/no-vacuum-full.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-vacuum-full", rule, "should disallow VACUUM FULL");
