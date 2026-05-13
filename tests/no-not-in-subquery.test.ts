import rule from "../src/rules/no-not-in-subquery.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-not-in-subquery", rule, "should disallow NOT IN (subquery)");
