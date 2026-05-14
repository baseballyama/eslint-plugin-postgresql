import rule from "../src/rules/no-set-search-path.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-set-search-path", rule, "should disallow SET search_path");
