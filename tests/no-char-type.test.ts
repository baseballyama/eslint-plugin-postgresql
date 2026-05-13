import rule from "../src/rules/no-char-type.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-char-type", rule, "should disallow char(n) column type");
