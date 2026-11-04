import { describe, it as test } from "node:test";
import { strict as assert } from "node:assert";
import { isPackageBooking } from "./booking-kind";

describe("package booking identification", () => {
  test("identifies linked packages", () => {
    assert.equal(isPackageBooking({ package_id: "package-id", message: null }), true);
  });
  test("identifies legacy package requests", () => {
    assert.equal(isPackageBooking({ package_id: null, message: "ՓԱՏԵԹ: Ամանորը Դիլիջանում" }), true);
  });
  test("does not label ordinary bookings as packages", () => {
    assert.equal(isPackageBooking({ package_id: null, message: "Սովորական ամրագրում" }), false);
  });
});