import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, relative, resolve } from "node:path";
import { Readable } from "node:stream";

const rootDir = resolve(import.meta.dirname, "..");
const clientDir = join(rootDir, "dist", "client");
const serverEntryPath = join(rootDir, "dist", "server", "server.js");

if (!existsSync(serverEntryPath)) {
  console.error("Missing dist/server/server.js. Run `npm run build` before `npm run start`.");
  process.exit(1);
}

const serverEntry = (await import(serverEntryPath)).default;

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".woff2", "font/woff2"],
]);

function safeClientPath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split("?")[0] ?? "/");
  const candidate = normalize(join(clientDir, decodedPath));
  const rel = relative(clientDir, candidate);
  if (rel.startsWith("..") || rel === "") return null;
  return candidate;
}

async function serveStatic(req, res, filePath) {
  try {
    const file = await stat(filePath);
    if (!file.isFile()) return false;

    const headers = {
      "content-type": mimeTypes.get(extname(filePath)) ?? "application/octet-stream",
      "content-length": String(file.size),
      "cache-control": filePath.includes(`${clientDir}/assets/`)
        ? "public, max-age=31536000, immutable"
        : "public, max-age=300",
    };

    res.writeHead(200, headers);
    if (req.method === "HEAD") {
      res.end();
      return true;
    }
    createReadStream(filePath).pipe(res);
    return true;
  } catch {
    return false;
  }
}

async function sendWebResponse(res, response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));

  if (!response.body) {
    res.end();
    return;
  }

  Readable.fromWeb(response.body).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    const host = req.headers.host ?? "127.0.0.1";
    const url = new URL(req.url ?? "/", `http://${host}`);
    const staticPath = safeClientPath(url.pathname);

    if (staticPath && (await serveStatic(req, res, staticPath))) return;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        for (const item of value) headers.append(key, item);
      } else if (value !== undefined) {
        headers.set(key, value);
      }
    }

    const method = req.method ?? "GET";
    const requestInit =
      method === "GET" || method === "HEAD"
        ? { method, headers }
        : { method, headers, body: req, duplex: "half" };

    const request = new Request(url, requestInit);
    const response = await serverEntry.fetch(request, {}, {});
    await sendWebResponse(res, response);
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("Internal Server Error");
  }
});

const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? "127.0.0.1";

server.listen(port, host, () => {
  console.log(`Finastic production server running at http://${host}:${port}/`);
});
