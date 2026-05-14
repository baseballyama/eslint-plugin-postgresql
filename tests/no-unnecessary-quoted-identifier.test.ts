import rule from "../src/rules/no-unnecessary-quoted-identifier.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "no-unnecessary-quoted-identifier",
  rule,
  "Disallow unnecessary double-quoting of identifiers",
);
