import { browser } from "$app/environment";
import type { Diagnostic, EnabledRules, LintRequest, LintResponse, ReadyMessage } from "./types";

let worker: Worker | null = null;
let nextId = 1;
let ready: Promise<void> | null = null;
const pending = new Map<number, (resp: LintResponse) => void>();
let readyError: string | null = null;

function ensureWorker(): Worker | null {
  if (!browser) return null;
  if (worker) return worker;
  worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
  ready = new Promise<void>((resolve, reject) => {
    const onMessage = (e: MessageEvent<ReadyMessage | LintResponse>) => {
      const data = e.data;
      if ((data as ReadyMessage).type === "ready") {
        const r = data as ReadyMessage;
        if (r.ok) resolve();
        else {
          readyError = r.error ?? "Worker failed to initialize";
          reject(new Error(readyError));
        }
        worker?.removeEventListener("message", onMessage);
        worker?.addEventListener("message", onLint);
        return;
      }
    };
    worker?.addEventListener("message", onMessage);
  });
  return worker;
}

function onLint(e: MessageEvent<LintResponse>) {
  const data = e.data;
  if (data?.type !== "lint") return;
  const cb = pending.get(data.id);
  if (cb) {
    pending.delete(data.id);
    cb(data);
  }
}

export interface LintResult {
  diagnostics: Diagnostic[];
  parseMs: number;
  ruleMs: number;
  fatal?: string;
}

export async function lint(sql: string, enabled: EnabledRules): Promise<LintResult> {
  const w = ensureWorker();
  if (!w) return { diagnostics: [], parseMs: 0, ruleMs: 0 };
  try {
    await ready;
  } catch (err) {
    return {
      diagnostics: [],
      parseMs: 0,
      ruleMs: 0,
      fatal: readyError ?? (err instanceof Error ? err.message : String(err)),
    };
  }
  const id = nextId++;
  return new Promise<LintResult>((resolve) => {
    pending.set(id, (resp) =>
      resolve({ diagnostics: resp.diagnostics, parseMs: resp.parseMs, ruleMs: resp.ruleMs }),
    );
    // Svelte 5's `$state` returns Proxy-wrapped values. structuredClone (and
    // postMessage's clone algorithm) can't ferry proxies — flatten to a plain
    // object before crossing the worker boundary.
    const req: LintRequest = { id, type: "lint", sql, enabled: { ...enabled } };
    w.postMessage(req);
  });
}

export function isWorkerReady(): boolean {
  return worker !== null && ready !== null && readyError === null;
}
