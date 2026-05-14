import type { AST, Rule } from "eslint";

type Form = "operator" | "function";

const DEFAULT_FORM: Form = "operator";

interface MinimalToken {
  type?: string;
  value: string;
  range: [number, number];
}

// Walk forward through tokens while they look like a type expression:
// identifier qualifiers (`schema.name`), and parenthesized typmods
// (`(255)`, `(10, 2)`). Stop at the first token that doesn't fit.
const findTypeEnd = (
  tokens: readonly MinimalToken[],
  startIndex: number,
): number | null => {
  let i = startIndex;
  if (i >= tokens.length) return null;
  // First token must be the type's identifier.
  const first = tokens[i]!;
  if (first.type !== "Identifier" && first.type !== "Keyword") return null;
  let end = first.range[1];
  i++;
  // Optional qualifiers: `.identifier` chains.
  while (i + 1 < tokens.length) {
    const dot = tokens[i]!;
    const next = tokens[i + 1]!;
    if (
      dot.type === "Punctuator" &&
      dot.value === "." &&
      (next.type === "Identifier" || next.type === "Keyword")
    ) {
      end = next.range[1];
      i += 2;
    } else {
      break;
    }
  }
  // Optional typmods: a single matched `(...)` group.
  if (
    i < tokens.length &&
    tokens[i]!.type === "Punctuator" &&
    tokens[i]!.value === "("
  ) {
    let depth = 1;
    i++;
    while (i < tokens.length && depth > 0) {
      const t = tokens[i]!;
      if (t.type === "Punctuator" && t.value === "(") depth++;
      else if (t.type === "Punctuator" && t.value === ")") depth--;
      end = t.range[1];
      i++;
    }
    if (depth !== 0) return null;
  }
  return end;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Enforce a single style for type casts (`x::int` operator form vs `CAST(x AS int)` function form)",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          form: { enum: ["operator", "function"] },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferOperator:
        "Use `<expr>::type` operator form instead of `CAST(...)`.",
      preferFunction:
        "Use `CAST(<expr> AS type)` instead of the `::` operator.",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    const option = (context.options[0] ?? {}) as { form?: Form };
    const target: Form = option.form ?? DEFAULT_FORM;
    const tokens = (sourceCode.ast.tokens ?? []) as MinimalToken[];

    return {
      TypeCast(node: {
        range?: [number, number];
        arg?: { range?: [number, number] };
      }) {
        const tcRange = node.range;
        const argRange = node.arg?.range;
        if (!tcRange || !argRange) return;

        // Identify the cast's source form by the token sitting at the
        // node's location: `CAST` for the function form, `::` for the
        // operator form. Anything else (some unusual rewrite) is left
        // alone.
        const headIndex = tokens.findIndex((t) => t.range[0] === tcRange[0]);
        if (headIndex < 0) return;
        const head = tokens[headIndex]!;
        const isFunction =
          head.type === "Keyword" && head.value.toUpperCase() === "CAST";
        const isOperator = head.type === "Operator" && head.value === "::";
        if (!isFunction && !isOperator) return;

        if (
          (isFunction && target === "function") ||
          (isOperator && target === "operator")
        ) {
          return;
        }

        if (isFunction) {
          // CAST ( arg AS type ) — find the opening `(`, the matching
          // `)`, and the `AS` keyword between them.
          const open = tokens[headIndex + 1];
          if (open?.type !== "Punctuator" || open.value !== "(") return;
          let depth = 1;
          let closeIdx = -1;
          let asIdx = -1;
          for (let i = headIndex + 2; i < tokens.length; i++) {
            const t = tokens[i]!;
            if (t.type === "Punctuator" && t.value === "(") depth++;
            else if (t.type === "Punctuator" && t.value === ")") {
              depth--;
              if (depth === 0) {
                closeIdx = i;
                break;
              }
            } else if (
              depth === 1 &&
              t.type === "Keyword" &&
              t.value.toUpperCase() === "AS"
            ) {
              asIdx = i;
            }
          }
          if (asIdx < 0 || closeIdx < 0) return;
          const close = tokens[closeIdx]!;
          const typeStartIdx = asIdx + 1;
          const typeEnd = findTypeEnd(tokens, typeStartIdx);
          if (typeEnd === null) return;
          const argSrc = sourceCode.getText().slice(argRange[0], argRange[1]);
          const typeSrc = sourceCode
            .getText()
            .slice(tokens[typeStartIdx]!.range[0], typeEnd);
          const replacement = `${argSrc}::${typeSrc}`;
          const replaceRange: [number, number] = [
            head.range[0],
            close.range[1],
          ];
          context.report({
            loc: rangeToLoc(sourceCode, replaceRange),
            messageId: "preferOperator",
            fix: (fixer) => fixer.replaceTextRange(replaceRange, replacement),
          });
          return;
        }

        // Operator form: arg :: type
        const typeStartIdx = headIndex + 1;
        const typeEnd = findTypeEnd(tokens, typeStartIdx);
        if (typeEnd === null) return;
        const argSrc = sourceCode.getText().slice(argRange[0], argRange[1]);
        const typeSrc = sourceCode
          .getText()
          .slice(tokens[typeStartIdx]!.range[0], typeEnd);
        const replacement = `CAST(${argSrc} AS ${typeSrc})`;
        const replaceRange: [number, number] = [argRange[0], typeEnd];
        context.report({
          loc: rangeToLoc(sourceCode, replaceRange),
          messageId: "preferFunction",
          fix: (fixer) => fixer.replaceTextRange(replaceRange, replacement),
        });
      },
    };
  },
};

const rangeToLoc = (
  sourceCode: {
    getLocFromIndex: (i: number) => { line: number; column: number };
  },
  range: [number, number],
): AST.SourceLocation => ({
  start: sourceCode.getLocFromIndex(range[0]),
  end: sourceCode.getLocFromIndex(range[1]),
});

export default rule;
