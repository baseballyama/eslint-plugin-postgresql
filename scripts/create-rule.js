#!/usr/bin/env node

import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("❌ Please specify a rule name");
  console.log("📖 Usage: npm run create-rule <rule-name>");
  console.log("📝 Example: npm run create-rule no-select-star");
  process.exit(1);
}

const ruleName = args[0];
const description = args[1] || `Enforce ${ruleName} rule`;

// Rule name validation
if (!/^[a-z][a-z0-9-]*$/.test(ruleName)) {
  console.error(
    "❌ Rule name can only contain lowercase letters and hyphens (e.g., no-select-star)",
  );
  process.exit(1);
}

console.log(`🚀 Creating new rule "${ruleName}"...`);

// 1. Create rule file
const ruleFilePath = join(projectRoot, "src", "rules", `${ruleName}.js`);
if (existsSync(ruleFilePath)) {
  console.error(`❌ Rule file ${ruleFilePath} already exists`);
  process.exit(1);
}

const ruleContent = `/**
 * @fileoverview ${description}
 * @author ESLint Plugin PostgreSQL
 */

/**
 * @typedef {import('eslint').Rule.RuleModule} RuleModule
 * @typedef {import('eslint').Rule.RuleContext} RuleContext
 * @typedef {import('postgresql-eslint-parser').AST.Node} PostgreSQLNode
 */

/**
 * @type {RuleModule}
 */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "${description}",
      category: "Best Practices",
      recommended: false,
    },
    fixable: null,
    schema: [],
    messages: {
      ${ruleName.replace(/-/g, "")}Error: "${description.replace(/^Enforce /, "Should ")}"
    },
  },

  create(context) {
    return {
      // TODO: Implement the rule logic here
      // Example:
      // SelectStmt(node) {
      //   // Rule check logic
      //   if (/* condition */) {
      //     context.report({
      //       node,
      //       messageId: "${ruleName.replace(/-/g, "")}Error",
      //     });
      //   }
      // }
    };
  },
};
`;

writeFileSync(ruleFilePath, ruleContent);
console.log(`✅ Created rule file: ${ruleFilePath}`);

// 2. Create test file
const testFilePath = join(projectRoot, "tests", `${ruleName}.test.ts`);
if (existsSync(testFilePath)) {
  console.error(`❌ Test file ${testFilePath} already exists`);
  process.exit(1);
}

const testContent = `import rule from "../src/rules/${ruleName}.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "${ruleName}",
  rule,
  "${description}"
);
`;

writeFileSync(testFilePath, testContent);
console.log(`✅ Created test file: ${testFilePath}`);

// 3. Create fixture directories
const fixturesDir = join(projectRoot, "tests", "fixtures", ruleName);
const validDir = join(fixturesDir, "valid");
const invalidDir = join(fixturesDir, "invalid");

mkdirSync(validDir, { recursive: true });
mkdirSync(invalidDir, { recursive: true });

console.log(`✅ Created fixture directories: ${fixturesDir}`);

// 4. Create sample fixture files
const validSamplePath = join(validDir, "example-valid.sql");
const invalidSamplePath = join(invalidDir, "example-invalid.sql");

writeFileSync(
  validSamplePath,
  `-- Valid example for ${ruleName} rule
-- TODO: Add valid SQL examples here
SELECT id, name FROM users LIMIT 10;
`,
);

writeFileSync(
  invalidSamplePath,
  `-- Invalid example for ${ruleName} rule
-- TODO: Add invalid SQL examples here
SELECT * FROM users;
`,
);

// Sibling YAML metadata (errors / output / options) is generated on first run
// via `pnpm update-fixtures` once the rule actually reports something.

console.log(`✅ Created sample fixture files`);

console.log(`
🎉 Rule "${ruleName}" scaffold has been created!

📁 Created files:
  - ${ruleFilePath}
  - ${testFilePath}
  - ${validSamplePath}
  - ${invalidSamplePath}

📝 Next steps:
  1. Implement rule logic in ${ruleFilePath}
  2. Add SQL fixtures under ${validDir}/ and ${invalidDir}/
  3. Run \`pnpm update-fixtures\` to materialise the YAML metadata
     (errors / output / options) for each invalid fixture, then
     run \`pnpm test\` to verify.

🚀 Happy coding!
`);
