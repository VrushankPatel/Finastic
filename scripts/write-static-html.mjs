import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");
const clientDir = join(rootDir, "dist", "client");
const serverEntryPath = join(rootDir, "dist", "server", "server.js");

const routes = [
  "/",
  "/profile",
  "/inputs",
  "/portfolio",
  "/monte-carlo",
  "/insights",
  "/scenarios",
  "/withdrawal",
  "/risk",
  "/timeline",
  "/data",
  "/settings",
];

const serverEntry = (await import(serverEntryPath)).default;

function outputPathForRoute(route) {
  if (route === "/") return join(clientDir, "index.html");
  return join(clientDir, route.replace(/^\//, ""), "index.html");
}

for (const route of routes) {
  const response = await serverEntry.fetch(
    new Request(`https://finastic-x.web.app${route}`),
    {},
    {},
  );

  if (!response.ok) {
    throw new Error(`Static render failed for ${route}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const outputPath = outputPathForRoute(route);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html);
  console.log(`wrote ${route} -> ${outputPath}`);
}
