import { describe, expect, test } from "bun:test";
import { isPackageBooking } from "./booking-kind";

describe("package booking identification", () => {
  test("identifies linked packages", () => {
    expect(isPackageBooking({ package_id: "package-id", message: null })).toBe(true);
  });
  test("identifies legacy package requests", () => {
    expect(isPackageBooking({ package_id: null, message: "ՓԱՏԵԹ: Ամանորը Դիլիջանում" })).toBe(true);
  });
  test("does not label ordinary bookings as packages", () => {
    expect(isPackageBooking({ package_id: null, message: "Սովորական ամրագրում" })).toBe(false);
  });
});