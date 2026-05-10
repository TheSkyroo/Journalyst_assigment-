# Broker CSV Trade Import Service

Production-grade TypeScript service for importing broker CSV exports with incompatible layouts and normalizing them into a single trade schema.

## Architecture

The service is built around a simplified parser contract designed for reliability and strict adherence to requirements:

- **BrokerParser Interface**: Defines a strict contract where each parser receives a CSV string and returns a flat array of normalized Trade objects.

- **Abstract Parser Base**: Centralizes shared logic for CSV record parsing, row normalization, and Zod-based validation.

- **BrokerRegistry**: Automatically detects the appropriate broker (Zerodha or IBKR) based on the CSV headers.

- **ImportService**: Orchestrates the detection and parsing process, providing a clean interface for the API layer.

- **Fastify API**: Handles multipart file uploads, structured error reporting, and serves the normalized data.

## Folder Structure

`	ext
.
├── src
│   ├── app.ts                  # Fastify application setup
│   ├── server.ts               # Server entry point
│   ├── domain
│   │   ├── errors.ts           # Custom domain error classes
│   │   └── import-types.ts     # Core CSV and Document types
│   ├── parsers
│   │   ├── base
│   │   │   └── broker-parser.ts # Abstract base class and interfaces
│   │   ├── brokers
│   │   │   ├── ibkr-parser.ts   # IBKR specific logic
│   │   │   └── zerodha-parser.ts # Zerodha specific logic
│   │   └── registry
│   │       └── broker-registry.ts # Detection logic
│   ├── routes
│   │   └── import-route.ts      # /import endpoint definition
│   ├── schemas
│   │   ├── api.ts              # Zod schemas for API responses
│   │   └── trade.ts            # The unified Trade schema
│   ├── services
│   │   └── import-service.ts    # Main business logic
│   └── utils                   # Helper utilities (CSV, Date, Normalization)
└── tests                       # Vitest test suite (Unit + Integration)
`

## Unified Trade Schema

Every imported row is normalized into this consistent format:

`	s
{
  symbol: string;         // e.g., "RELIANCE"
  side: "BUY" | "SELL";   // Normalized action
  quantity: number;       // Positive quantity
  price: number;          // Unit price
  totalAmount: number;    // Computed signed gross total
  currency: string;       // ISO 3-letter code (e.g., "INR", "USD")
  executedAt: string;     // ISO 8601 timestamp
  broker: string;         // Broker identifier ("zerodha" | "ibkr")
  rawData: object;        // Original broker-specific fields preserved
}
`

## Running Locally

### Prerequisites

- Node.js 22+
- npm 10+

### Setup

\\\ash
npm install
\\\

### Development

\\\ash
npm run dev
\\\

### Run Tests

\\\ash
npm test
\\\

## API Usage

### Import CSV

**Endpoint**: \POST /import\

**Content-Type**: \multipart/form-data\

**Response (Success 200 OK)**:

Returns a JSON array of normalized trades.

\\\json
[
  {
    "symbol": "RELIANCE",
    "side": "BUY",
    "quantity": 10,
    "price": 2450.5,
    "totalAmount": 24505,
    "currency": "INR",
    "executedAt": "2026-04-01T00:00:00.000Z",
    "broker": "zerodha",
    "rawData": { ... }
  }
]
\\\

---

## Detailed Postman Testing Guide

To test the trade import functionality using Postman, follow these steps:

### 1. Create a New Request

1. Open Postman and click the **+** button or **New > HTTP Request**.
2. Set the HTTP method to **POST**.
3. Enter the URL: \http://localhost:3000/import\

### 2. Configure Multipart Body

1. Navigate to the **Body** tab below the URL bar.
2. Select the **form-data** radio button.
3. In the key-value table:
   - In the **Key** column, type \ile\.
   - Hover over the \ile\ key cell and change the dropdown from **Text** to **File**.
   - In the **Value** column, click **Select Files** and choose one of the sample CSVs (e.g., from \	ests/fixtures/zerodha-mixed.csv\).

### 3. Send and Inspect

1. Click **Send**.
2. **Success**: You should see a \200 OK\ status and a JSON array of trades in the response pane.
3. **Validation Error**: If you upload an empty or unsupported file, you will receive a \400 Bad Request\ with a structured error code (e.g., \UNKNOWN_BROKER\).

### 4. Automated Testing in Postman (Optional)

You can add this snippet to the **Tests** tab in Postman to verify the response:

\\\javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response is an array of trades", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an("array");
    if (jsonData.length > 0) {
        pm.expect(jsonData[0]).to.have.property("symbol");
        pm.expect(jsonData[0]).to.have.property("broker");
    }
});
\\\

---

## Design Decisions

- **Plugin Contract**: The BrokerParser interface makes the system easily extensible. Adding a new broker requires zero changes to existing parser logic.
- **Strict Validation**: We use Zod for the final schema guard, ensuring that the API never emits data that doesn't meet the "Unified Trade Schema" contract.
- **Preservation of Raw Data**: While data is normalized, the original fields are kept in rawData for debugging or audit purposes.
- **Fail-Safe Processing**: The parser is designed to skip malformed rows within a file while successfully importing valid ones, maximizing data recovery.

## Operational Extras

- **Swagger Documentation**: Available at \http://localhost:3000/docs\.
- **Docker Support**: Use \docker compose up\ to run the entire environment.
- **CI/CD Ready**: Includes GitHub Actions workflows and Husky pre-commit hooks for linting and testing.

---

# Journalyst_assigment-
