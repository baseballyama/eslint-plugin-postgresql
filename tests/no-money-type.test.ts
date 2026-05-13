import rule from "../src/rules/no-money-type.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-money-type", rule, "should disallow money column type");
