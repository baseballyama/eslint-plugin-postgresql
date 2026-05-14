import rule from "../src/rules/plpgsql-keyword-case.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "plpgsql-keyword-case",
  rule,
  "Enforce a consistent case for SQL and PL/pgSQL keywords inside PL/pgSQL bodies",
);
