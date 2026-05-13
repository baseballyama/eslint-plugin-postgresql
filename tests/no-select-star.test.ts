import rule from "../src/rules/no-select-star.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-select-star", rule, "should disallow SELECT *");
