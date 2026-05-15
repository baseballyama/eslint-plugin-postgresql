import rule from "../src/rules/no-identifier-too-long.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-identifier-too-long",
  rule,
  "should flag identifiers longer than NAMEDATALEN - 1 bytes",
);
