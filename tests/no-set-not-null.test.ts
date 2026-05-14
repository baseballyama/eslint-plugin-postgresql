import rule from "../src/rules/no-set-not-null.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-set-not-null", rule, "should disallow SET NOT NULL");
