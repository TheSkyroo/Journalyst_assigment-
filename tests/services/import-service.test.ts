import { describe, expect, it } from "vitest";

import { EmptyFileError, MalformedCsvError, UnknownBrokerError } from "../../src/domain/errors.js";
import { ImportService } from "../../src/services/import-service.js";
import { readFixture } from "../test-helpers.js";

describe("ImportService", () => {
  const service = new ImportService();
  const singleValidZerodhaRow = [
    "symbol,isin,trade_date,trade_type,quantity,price,trade_id,order_id,exchange,segment",
    "RELIANCE,INE002A01018,01-04-2026,buy,10,2450.50,TRD001,ORD001,NSE,EQ",
  ].join("\n");

  it("auto-detects Zerodha files from headers", async () => {
    const trades = await service.importTrades(readFixture("zerodha-mixed.csv"));
    expect(trades).toHaveLength(5);
  });

  it("auto-detects IBKR files from headers", async () => {
    const trades = await service.importTrades(readFixture("ibkr-mixed.csv"));
    expect(trades).toHaveLength(5);
  });

  it("returns an empty array when every row fails", async () => {
    const trades = await service.importTrades(readFixture("zerodha-all-invalid.csv"));
    expect(trades).toEqual([]);
  });

  it("parses a single valid row", async () => {
    const trades = await service.importTrades(singleValidZerodhaRow);

    expect(trades).toHaveLength(1);
    expect(trades[0]).toMatchObject({
      symbol: "RELIANCE",
      side: "BUY",
      quantity: 10,
      price: 2450.5,
      totalAmount: 24505,
      currency: "INR",
      executedAt: "2026-04-01T00:00:00.000Z",
      broker: "zerodha",
    });
  });

  it("rejects unknown broker formats with a structured error", async () => {
    await expect(service.importTrades(readFixture("unknown-broker.csv"))).rejects.toBeInstanceOf(UnknownBrokerError);
  });

  it("rejects empty files before parsing", async () => {
    await expect(service.importTrades("   \n")).rejects.toBeInstanceOf(EmptyFileError);
  });

  it("rejects malformed CSV input", async () => {
    await expect(service.importTrades(readFixture("malformed.csv"))).rejects.toBeInstanceOf(MalformedCsvError);
  });
});
