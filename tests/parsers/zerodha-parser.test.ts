import { describe, expect, it } from "vitest";

import { ZerodhaParser } from "../../src/parsers/brokers/zerodha-parser.js";
import { readFixture } from "../test-helpers.js";

describe("ZerodhaParser", () => {
  it("normalizes mixed valid and invalid rows without aborting the import", async () => {
    const parser = new ZerodhaParser();

    const trades = await parser.parse(readFixture("zerodha-mixed.csv"));

    expect(trades).toHaveLength(5);
    expect(trades[0]).toMatchObject({
      symbol: "RELIANCE",
      side: "BUY",
      quantity: 10,
      price: 2450.5,
      totalAmount: 24505,
      currency: "INR",
      broker: "zerodha",
      executedAt: "2026-04-01T00:00:00.000Z",
    });

    expect(trades[1]?.totalAmount).toBe(-38018.75);
    expect(trades[4]?.side).toBe("SELL");
  });
});
