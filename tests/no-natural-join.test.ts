import rule from "../src/rules/no-natural-join.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-natural-join", rule, "should disallow NATURAL JOIN");
