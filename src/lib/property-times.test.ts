import { describe, it as test } from "node:test";
import { strict as assert } from "node:assert";
import { requiredPropertyTimeErrors } from "./property-times";

describe("required property arrival times", () => {
  test("requires a check-in time", () => {
    assert.deepEqual(requiredPropertyTimeErrors("", "12:00"), {
      check_in_time: true,
      check_out_time: false,
    });
  });

  test("requires a check-out time", () => {
    assert.deepEqual(requiredPropertyTimeErrors("14:00", ""), {
      check_in_time: false,
      check_out_time: true,
    });
  });

  test("accepts both times when provided", () => {
    assert.deepEqual(requiredPropertyTimeErrors("15:30", "11:00"), {
      check_in_time: false,
      check_out_time: false,
    });
  });
});
