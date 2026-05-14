import rule from "../src/rules/no-update-without-from-binding.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-update-without-from-binding",
  rule,
  "Disallow UPDATE ... FROM other without WHERE (Cartesian)",
);
