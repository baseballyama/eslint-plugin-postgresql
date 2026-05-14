import { error } from "@sveltejs/kit";
import { rules, ruleByName } from "$lib/data/rules";
import type { PageLoad } from "./$types";
import type { EntryGenerator } from "./$types";

export const prerender = true;

export const entries: EntryGenerator = () => rules.map((r) => ({ rule: r.name }));

export const load: PageLoad = ({ params }) => {
  const rule = ruleByName.get(params.rule);
  if (!rule) throw error(404, `Unknown rule: ${params.rule}`);
  return { rule };
};
