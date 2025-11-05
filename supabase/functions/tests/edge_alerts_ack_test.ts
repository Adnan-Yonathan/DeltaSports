import { assertEquals } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { normalizeAction } from "../edge-alerts-ack/normalize-action.ts";

Deno.test("normalizeAction defaults to acknowledged", () => {
  assertEquals(normalizeAction(), "acknowledged");
  assertEquals(normalizeAction(""), "acknowledged");
  assertEquals(normalizeAction("   "), "acknowledged");
});

Deno.test("normalizeAction trims whitespace", () => {
  assertEquals(normalizeAction("  snoozed  "), "snoozed");
});

Deno.test("normalizeAction keeps original action", () => {
  assertEquals(normalizeAction("resolved"), "resolved");
});
