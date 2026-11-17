import { describe, it as test } from "node:test";
import { strict as assert } from "node:assert";
import { bookingWaitDuration } from "./booking-wait";

const NOW = new Date("2026-11-18T12:00:00.000Z");

describe("booking waiting duration", () => {
  test("shows elapsed minutes for a recent request", () => {
    assert.equal(bookingWaitDuration("2026-11-18T11:45:00.000Z", NOW), "15 րոպե");
  });

  test("shows elapsed hours for a same-day request", () => {
    assert.equal(bookingWaitDuration("2026-11-18T09:00:00.000Z", NOW), "3 ժամ");
  });

  test("shows elapsed days for an older request", () => {
    assert.equal(bookingWaitDuration("2026-11-16T11:00:00.000Z", NOW), "2 օր");
  });
});
