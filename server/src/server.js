require("dotenv").config();

const http = require("http");
const cors = require("cors");
const express = require("express");
const connectDB = require("./config/db");
const attachSocketServer = require("./sockets/socketServer");
const candleAggregator = require("./services/candleAggregator");
const brokerFeed = require("./services/brokerFeed");

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "Guardrail Options API" });
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/accounts", require("./routes/account.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/journal", require("./routes/journal.routes"));
app.get("/api/candles/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const fallbackLtp =
      brokerFeed.spotPrices[symbol] || Number(req.query.ltp) || 25350;
    const candles = await candleAggregator.getHistoricalCandles(
      symbol,
      fallbackLtp,
    );
    res.json(candles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const io = attachSocketServer(server);
global.io = io;

const port = Number(process.env.PORT) || 5000;

connectDB()
  .then(() => {
    server.listen(port, () => {
      console.log(`Guardrail Options API listening on port ${port}.`);
      brokerFeed.startFeed(io);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
    process.exitCode = 1;
  });
