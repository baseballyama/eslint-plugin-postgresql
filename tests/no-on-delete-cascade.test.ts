import rule from "../src/rules/no-on-delete-cascade.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-on-delete-cascade",
  rule,
  "Disallow ON DELETE CASCADE on foreign keys",
);
