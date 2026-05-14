import rule from "../src/rules/no-rename-column.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-rename-column", rule, "should disallow RENAME COLUMN");
