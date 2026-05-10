import { describe, expect, it } from "vitest";

import { IbkrParser } from "../../src/parsers/brokers/ibkr-parser.js";
import { readFixture } from "../test-helpers.js";

describe("IbkrParser", () => {
  it("uses signed gross totals while preserving broker-specific fee fields in rawData", async () => {
    const parser = new IbkrParser();

    const trades = await parser.parse(readFixture("ibkr-mixed.csv"));

    expect(trades).toHaveLength(5);

    expect(trades[0]).toMatchObject({
      symbol: "AAPL",
      side: "BUY",
      totalAmount: 18550,
      executedAt: "2026-04-01T14:30:00.000Z",
    });
    expect(trades[0]?.rawData.NetAmount).toBe("18549.00");
    expect(trades[1]?.totalAmount).toBe(-21012.5);
    expect(trades[2]).toMatchObject({
      symbol: "EUR/USD",
      currency: "USD",
      totalAmount: 10850,
    });
    expect(trades[3]).toMatchObject({
      executedAt: "2026-04-03T00:00:00.000Z",
      totalAmount: 6125,
    });
    expect(trades[4]?.rawData.Commission).toBe("");
  });
});
