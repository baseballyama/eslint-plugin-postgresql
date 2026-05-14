import rule from "../src/rules/no-rename-table.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-rename-table", rule, "should disallow RENAME TABLE");
