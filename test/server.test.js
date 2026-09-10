import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/server.js";

async function withServer(store, fn) {
  const server = createServer(store);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    await fn(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }
}

describe("chalkline-storage", () => {
  it("writes an object", async () => {
    const calls = [];

    await withServer({ put: async (object) => calls.push(object) }, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/objects`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          key: "drop-ins/rcpt_test.json",
          body: "{}",
          contentType: "application/json",
        }),
      });

      assert.equal(res.status, 201);
      assert.equal(calls[0].key, "drop-ins/rcpt_test.json");
    });
  });

  it("returns a generic 500 when the object store rejects a write", async () => {
    const denied = new Error("not allowed");
    denied.name = "AccessDenied";

    await withServer({ put: async () => Promise.reject(denied) }, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/objects`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: "drop-ins/rcpt_test.json", body: "{}" }),
      });

      assert.equal(res.status, 500);
      assert.deepEqual(await res.json(), { error: "failed to write object" });
    });
  });
});
