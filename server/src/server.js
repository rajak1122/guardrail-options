require('dotenv').config();

const http = require('http');
const cors = require('cors');
const express = require('express');
const connectDB = require('./config/db');
const attachSocketServer = require('./sockets/socketServer');
const brokerFeed = require('./services/brokerFeed');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Guardrail Options API' });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/accounts', require('./routes/account.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/journal', require('./routes/journal.routes'));

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
    console.error('Failed to connect to MongoDB:', error);
    process.exitCode = 1;
  });