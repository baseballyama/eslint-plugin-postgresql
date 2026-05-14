import rule from "../src/rules/no-grant-all.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-grant-all", rule, "Disallow GRANT ALL / GRANT ALL PRIVILEGES");
