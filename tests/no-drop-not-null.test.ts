import rule from "../src/rules/no-drop-not-null.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-drop-not-null", rule, "should disallow DROP NOT NULL");
