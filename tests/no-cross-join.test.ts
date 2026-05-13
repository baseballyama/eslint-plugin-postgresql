import rule from "../src/rules/no-cross-join.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-cross-join", rule, "should disallow CROSS JOIN");
