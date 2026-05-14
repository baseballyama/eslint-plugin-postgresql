import type { Severity } from "$lib/data/rules";

export interface Diagnostic {
  ruleId: string;
  severity: Exclude<Severity, "off">;
  message: string;
  messageId: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export type EnabledRules = Record<string, Exclude<Severity, "off">>;

export interface LintRequest {
  id: number;
  type: "lint";
  sql: string;
  enabled: EnabledRules;
}

export interface LintResponse {
  id: number;
  type: "lint";
  diagnostics: Diagnostic[];
  error?: string;
  parseMs: number;
  ruleMs: number;
}

export interface ReadyMessage {
  type: "ready";
  ok: boolean;
  error?: string;
}
