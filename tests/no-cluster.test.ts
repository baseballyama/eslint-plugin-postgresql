import rule from "../src/rules/no-cluster.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest("no-cluster", rule, "should disallow CLUSTER");
