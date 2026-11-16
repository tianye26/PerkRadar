import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { insertSmsMessage, listSmsMessages } from "../src/lib/db";
import { useMemoryDb } from "./helpers";

describe("telnyx sms inbox", () => {
  it("stores an inbound SMS and lists it newest first, deduping retries", () => {
    useMemoryDb();
    const first = {
      messageId: "msg-1",
      eventId: "evt-1",
      fromNumber: "+19784159358",
      toNumber: "+17712472692",
      body: "hello from test",
      type: "SMS",
      receivedAt: 1000,
      createdAt: 1000,
    };
    assert.equal(insertSmsMessage(first), true);
    // Telnyx retries the same webhook on a slow 2xx; same message_id must not duplicate.
    assert.equal(insertSmsMessage({ ...first, body: "hello again" }), false);
    insertSmsMessage({ ...first, messageId: "msg-2", body: "second", receivedAt: 2000, createdAt: 2000 });
    const listed = listSmsMessages();
    assert.equal(listed.length, 2);
    assert.equal(listed[0]?.body, "second");
    assert.equal(listed[1]?.body, "hello from test");
  });
});
