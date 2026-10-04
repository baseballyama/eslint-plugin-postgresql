// Temporary: captures the docs site built from main (before) and from this
// branch (after), records what a visitor can reach from each page, and fails
// if the links, titles or active nav item differ between the two builds.
import { chromium, devices } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const out = process.argv[2];
const sites = { before: "http://127.0.0.1:8001", after: "http://127.0.0.1:8002" };
const base = "/eslint-plugin-postgresql/";
const pages = ["", "rules/", "rules/no-select-star/", "playground/"];
const viewports = {
  desktop: { viewport: { width: 1440, height: 900 } },
  mobile: devices["Pixel 7"],
};

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const report = {};
for (const [variant, origin] of Object.entries(sites)) {
  for (const [vp, options] of Object.entries(viewports)) {
    const context = await browser.newContext({ ...options, colorScheme: "light" });
    for (const path of pages) {
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      const response = await page.goto(origin + base + path, { waitUntil: "networkidle" });
      if (path === "playground/") await page.waitForTimeout(4000);
      const key = `${vp}:${path || "home"}`;
      const data = await page.evaluate(() => ({
        title: document.title,
        hrefs: [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")),
        absolute: [...document.querySelectorAll("a[href]")].map((a) => a.href),
        active: [...document.querySelectorAll("nav a.active")].map((a) => a.textContent.trim()),
        text: document.body.innerText.length,
      }));
      report[key] ??= {};
      report[key][variant] = { status: response.status(), errors, ...data };
      await page.screenshot({ path: `${out}/${variant}-${vp}-${(path || "home").replaceAll("/", "_")}.png`, fullPage: true });
      await page.close();
    }
    await context.close();
  }
}
await browser.close();

let failed = false;
for (const [key, { before, after }] of Object.entries(report)) {
  // `href` attributes may be written relative to the page, so compare the
  // URLs they resolve to, with each build's origin removed.
  const norm = (d, origin) => d.absolute.map((u) => u.replace(origin, ""));
  const same =
    before.title === after.title &&
    JSON.stringify(norm(before, sites.before)) === JSON.stringify(norm(after, sites.after)) &&
    JSON.stringify(before.active) === JSON.stringify(after.active) &&
    before.status === after.status;
  console.log(`${same ? "same" : "DIFF"} ${key}: status ${before.status}/${after.status}, ${after.absolute.length} links, active [${after.active}], text ${before.text}/${after.text}, errors ${before.errors.length}/${after.errors.length}`);
  if (!same) {
    failed = true;
    console.log(JSON.stringify({ before: { ...before, absolute: norm(before, sites.before) }, after: { ...after, absolute: norm(after, sites.after) } }, null, 1));
  }
  if (after.errors.length) console.log(`after errors on ${key}: ${after.errors.join(" | ")}`);
}

// Every same-site link from the after build must resolve on the static host.
const internal = new Set(
  Object.values(report).flatMap((r) => r.after.absolute.filter((u) => u.startsWith(sites.after + base))),
);
for (const url of internal) {
  const res = await fetch(url, { redirect: "manual" });
  if (res.status !== 200) {
    failed = true;
    console.log(`link ${url.replace(sites.after, "")} -> ${res.status}`);
  }
}
console.log(`checked ${internal.size} internal links`);
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 1));
process.exitCode = failed ? 1 : 0;
