import { ZerodhaParser } from "../brokers/zerodha-parser.js";
import { IbkrParser } from "../brokers/ibkr-parser.js";
import { BrokerRegistry } from "./broker-registry.js";

export const createDefaultBrokerRegistry = (): BrokerRegistry =>
  new BrokerRegistry([new ZerodhaParser(), new IbkrParser()]);
