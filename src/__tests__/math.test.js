import { describe, expect, it } from "vitest";
import { sum, formatPrice } from "../utils/math";

describe("math", () => {
  it("sums two numbers", () => {
    expect(sum(2, 3)).toBe(5);
  });

  it("formats price", () => {
    expect(formatPrice(15000)).toBe("15 000 FCFA");
  });
});
