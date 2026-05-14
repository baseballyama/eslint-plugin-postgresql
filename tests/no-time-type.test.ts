import rule from "../src/rules/no-time-type.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-time-type", rule, "should disallow TIME / TIMETZ columns");
