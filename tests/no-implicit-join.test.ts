import rule from "../src/rules/no-implicit-join.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-implicit-join", rule, "should disallow comma-separated FROM");
