import rule from "../src/rules/no-security-definer-without-search-path.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-security-definer-without-search-path",
  rule,
  "Disallow SECURITY DEFINER without SET search_path",
);
