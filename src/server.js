import http from "node:http";
import { pathToFileURL } from "node:url";
import { createObjectStore } from "./object-store.js";

const service = "chalkline-storage";

function log(level, msg, fields = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, msg, service, ...fields }));
}

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

export function createServer(store) {
  return http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      send(res, 200, { ok: true });
      return;
    }

    if (req.method !== "POST" || req.url !== "/objects") {
      send(res, 404, { error: "Not found" });
      return;
    }

    let object;
    try {
      object = await readJson(req);
    } catch {
      send(res, 400, { error: "invalid json" });
      return;
    }

    if (!object.key || object.body === undefined) {
      send(res, 400, { error: "key and body are required" });
      return;
    }

    try {
      await store.put(object);
      log("info", "object stored", { key: object.key });
      send(res, 201, { ok: true, key: object.key });
    } catch (err) {
      log("error", "object write failed", {
        key: object.key,
        errorName: err.name,
        errorCode: err.Code ?? err.code,
      });
      send(res, 500, { error: "failed to write object" });
    }
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 4000);
  createServer(await createObjectStore()).listen(port, () => {
    console.log(`listening on ${port}`);
  });
}
