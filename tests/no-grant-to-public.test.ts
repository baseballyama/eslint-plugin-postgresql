import rule from "../src/rules/no-grant-to-public.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-grant-to-public", rule, "should disallow GRANT ... TO PUBLIC");
